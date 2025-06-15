import { NextRequest, NextResponse } from "next/server";
import { desc, asc, sql, and, or, inArray, between, eq, count, ilike } from "drizzle-orm";
import { books, bookCategories, categories } from "@/db/schema";
import { db } from "@/db";

// Enhanced types
type WithRelevance = BookResult & { relevance_score?: number };
type SearchIntent = 'title' | 'author' | 'topic' | 'isbn' | 'general';

interface SearchParams {
  q?: string;
  size?: string;
  categories?: string;
  available?: string;
  type?: string;
  language?: string;
  periodicalFrequency?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface BookResult {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  barcode: string | null;
  description: string | null;
  language: string;
  coverImage: string | null;
  pdfUrl: string | null;
  publishedAt: Date | null;
  addedAt: Date;
  size: number;
  available: boolean;
  type: "BOOK" | "DOCUMENT" | "PERIODIC" | "ARTICLE";
  periodicalFrequency: string | null;
  periodicalIssue: string | null;
  articleJournal: string | null;
  documentType: string | null;
  categories: string[];
}

interface SearchResponse {
  books: BookResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    appliedFilters: Record<string, string>;
    resultsCount: number;
  };
  searchInsights: {
    originalQuery?: string;
    processedQuery?: string;
    correctedTerms?: string[];
    detectedIntent?: SearchIntent;
    suggestions?: string[];
    expandedTerms?: string[];
  };
}

type DrizzleCondition = ReturnType<typeof and> | ReturnType<typeof or> | ReturnType<typeof eq> | ReturnType<typeof ilike> | ReturnType<typeof between> | ReturnType<typeof inArray>;

// Smart search utilities
class SmartSearchEngine {
  // Common typos and corrections for library terms
  private static typoCorrections: Record<string, string> = {
    'algoritm': 'algorithm',
    'algorythm': 'algorithm',
    'programing': 'programming',
    'progamming': 'programming',
    'databse': 'database',
    'databas': 'database',
    'javascrip': 'javascript',
    'javasript': 'javascript',
    'machien': 'machine',
    'mashine': 'machine',
    'artifical': 'artificial',
    'artficial': 'artificial',
    'mathematic': 'mathematics',
    'mathmatics': 'mathematics',
    'physic': 'physics',
    'psycology': 'psychology',
    'psychlogy': 'psychology',
    'philosphy': 'philosophy',
    'philosofy': 'philosophy',
    'histroy': 'history',
    'hisory': 'history',
    'chemestry': 'chemistry',
    'chemisty': 'chemistry',
    'biolog': 'biology',
    'biologhy': 'biology',
    'enginerring': 'engineering',
    'enginering': 'engineering',
    'literatur': 'literature',
    'literture': 'literature',
    'socielogy': 'sociology',
    'sociologi': 'sociology'
  };

  // Subject synonyms for query expansion
  private static synonyms: Record<string, string[]> = {
    'ai': ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning'],
    'ml': ['machine learning', 'artificial intelligence', 'data science', 'algorithms'],
    'programming': ['coding', 'development', 'software', 'computer science'],
    'coding': ['programming', 'development', 'software engineering'],
    'math': ['mathematics', 'mathematical', 'calculus', 'algebra', 'geometry'],
    'cs': ['computer science', 'programming', 'algorithms', 'data structures'],
    'stats': ['statistics', 'statistical', 'data analysis', 'probability'],
    'bio': ['biology', 'biological', 'life science', 'biochemistry'],
    'chem': ['chemistry', 'chemical', 'organic chemistry', 'inorganic'],
    'phys': ['physics', 'physical', 'quantum', 'mechanics'],
    'psych': ['psychology', 'psychological', 'behavioral', 'cognitive'],
    'hist': ['history', 'historical', 'historical analysis'],
    'lit': ['literature', 'literary', 'novels', 'poetry', 'fiction'],
    'phil': ['philosophy', 'philosophical', 'ethics', 'logic'],
    'econ': ['economics', 'economic', 'finance', 'business'],
    'med': ['medicine', 'medical', 'health', 'healthcare', 'clinical'],
    'law': ['legal', 'jurisprudence', 'legislation', 'legal studies'],
    'eng': ['engineering', 'technical', 'mechanical', 'electrical', 'civil']
  };

  // Author name patterns for better matching
  private static authorPatterns = {
    commonPrefixes: ['dr', 'prof', 'professor', 'dr.', 'prof.'],
    commonSuffixes: ['jr', 'sr', 'jr.', 'sr.', 'phd', 'ph.d', 'md', 'm.d']
  };

  static detectSearchIntent(query: string): SearchIntent {
    const lowerQuery = query.toLowerCase().trim();
    
    // ISBN detection
    if (/^\d{10}$|^\d{13}$|^\d{9}[\dx]$/i.test(lowerQuery.replace(/[-\s]/g, ''))) {
      return 'isbn';
    }
    
    // Author search patterns
    if (lowerQuery.startsWith('by ') || 
        lowerQuery.includes(' by ') || 
        lowerQuery.startsWith('author:') ||
        /^[a-z]+\s+[a-z]+$/i.test(lowerQuery)) {
      return 'author';
    }
    
    // Title search patterns
    if (lowerQuery.startsWith('title:') || 
        lowerQuery.includes('"') ||
        /^(the|a|an)\s+/i.test(lowerQuery)) {
      return 'title';
    }
    
    // Topic/subject patterns
    if (Object.keys(this.synonyms).some(key => lowerQuery.includes(key)) ||
        lowerQuery.includes('about ') ||
        lowerQuery.includes('topic:') ||
        lowerQuery.includes('subject:')) {
      return 'topic';
    }
    
    return 'general';
  }

  static correctTypos(query: string): { corrected: string; corrections: string[] } {
    const words = query.toLowerCase().split(/\s+/);
    const corrections: string[] = [];
    const correctedWords = words.map(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.typoCorrections[cleanWord]) {
        corrections.push(`${cleanWord} → ${this.typoCorrections[cleanWord]}`);
        return word.replace(cleanWord, this.typoCorrections[cleanWord]);
      }
      return word;
    });
    
    return {
      corrected: correctedWords.join(' '),
      corrections
    };
  }

  static expandQuery(query: string, intent: SearchIntent): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const expanded = new Set<string>([query]);
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.synonyms[cleanWord]) {
        this.synonyms[cleanWord].forEach(synonym => {
          expanded.add(query.replace(new RegExp(cleanWord, 'gi'), synonym));
        });
      }
    });
    
    // Intent-specific expansions
    if (intent === 'author') {
      const cleanQuery = query.replace(/^(by\s+|author:\s*)/i, '');
      expanded.add(cleanQuery);
      
      // Handle author name variations
      const nameParts = cleanQuery.split(/\s+/);
      if (nameParts.length >= 2) {
        // Last name, First name format
        expanded.add(`${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(' ')}`);
        // First initial + Last name
        expanded.add(`${nameParts[0][0]}. ${nameParts[nameParts.length - 1]}`);
      }
    }
    
    return Array.from(expanded);
  }

  static generateSuggestions(query: string, intent: SearchIntent): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Intent-based suggestions
    switch (intent) {
      case 'general':
        suggestions.push(
          `"${query}"`, // Exact phrase
          `${query} introduction`, // Beginner books
          `${query} advanced`, // Advanced books
          `${query} handbook`, // Reference books
          `${query} guide` // Guide books
        );
        break;
        
      case 'topic':
        suggestions.push(
          `${query} textbook`,
          `${query} fundamentals`,
          `${query} principles`,
          `${query} theory`,
          `${query} practice`
        );
        break;
        
      case 'author':
        const authorName = query.replace(/^(by\s+|author:\s*)/i, '');
        suggestions.push(
          `books by ${authorName}`,
          `${authorName} complete works`,
          `${authorName} collection`
        );
        break;
    }
    
    return suggestions.slice(0, 5);
  }

  static calculateRelevanceScore(book: any, query: string, expandedTerms: string[], intent: SearchIntent): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const title = book.title.toLowerCase();
    const author = book.author.toLowerCase();
    const description = (book.description || '').toLowerCase();
    
    // Exact matches get highest score
    if (title.includes(lowerQuery)) score += 100;
    if (author.includes(lowerQuery)) score += 90;
    if (description.includes(lowerQuery)) score += 70;
    
    // Intent-specific scoring
    switch (intent) {
      case 'title':
        if (title.startsWith(lowerQuery)) score += 50;
        break;
      case 'author':
        const cleanQuery = lowerQuery.replace(/^(by\s+|author:\s*)/i, '');
        if (author.includes(cleanQuery)) score += 80;
        break;
      case 'isbn':
        if (book.isbn && book.isbn.replace(/[-\s]/g, '').includes(lowerQuery.replace(/[-\s]/g, ''))) {
          score += 200;
        }
        break;
    }
    
    // Expanded terms scoring
    expandedTerms.forEach(term => {
      const termLower = term.toLowerCase();
      if (title.includes(termLower)) score += 30;
      if (author.includes(termLower)) score += 25;
      if (description.includes(termLower)) score += 20;
    });
    
    // Boost recent books slightly
    const daysSinceAdded = (Date.now() - book.addedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded < 30) score += 10;
    
    // Boost available books
    if (book.available) score += 15;
    
    // Boost books with PDF
    if (book.pdfUrl) score += 10;
    
    return score;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse | { error: string }>> {
  try {
    const { searchParams } = request.nextUrl;
    
    // Extract and validate pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    
    // Extract search parameters
    const originalQuery = searchParams.get("q")?.trim();
    const params: SearchParams = {
      q: originalQuery || undefined,
      size: searchParams.get("size") || undefined,
      categories: searchParams.get("categories") || undefined,
      available: searchParams.get("available") || undefined,
      type: searchParams.get("type") || undefined,
      language: searchParams.get("language") || undefined,
      periodicalFrequency: searchParams.get("periodicalFrequency") || undefined,
      sortBy: searchParams.get("sortBy") || "relevance",
      sortOrder: searchParams.get("sortOrder") || "desc"
    };

    // Smart search processing
    const searchInsights: SearchResponse['searchInsights'] = {
      originalQuery
    };

    let processedQuery = originalQuery;
    let expandedTerms: string[] = [];
    let searchIntent: SearchIntent = 'general';

    if (originalQuery) {
      // Detect search intent
      searchIntent = SmartSearchEngine.detectSearchIntent(originalQuery);
      searchInsights.detectedIntent = searchIntent;

      // Correct typos
      const { corrected, corrections } = SmartSearchEngine.correctTypos(originalQuery);
      if (corrections.length > 0) {
        processedQuery = corrected;
        searchInsights.correctedTerms = corrections;
        searchInsights.processedQuery = processedQuery;
      }

      // Expand query with synonyms
      expandedTerms = SmartSearchEngine.expandQuery(processedQuery || originalQuery, searchIntent);
      if (expandedTerms.length > 1) {
        searchInsights.expandedTerms = expandedTerms.slice(1); // Exclude original
      }

      // Generate suggestions
      searchInsights.suggestions = SmartSearchEngine.generateSuggestions(processedQuery || originalQuery, searchIntent);
    }

    // Build conditions array
    const conditions: DrizzleCondition[] = [];

    // Enhanced text search with smart query processing
    if (processedQuery || originalQuery) {
      const queryToUse = processedQuery || originalQuery!;
      const searchTerms = [queryToUse, ...expandedTerms];
      
      const searchConditions = searchTerms.map(term => {
        const searchTerm = `%${term.toLowerCase()}%`;
        
        // Intent-specific search logic
        switch (searchIntent) {
          case 'isbn':
            const cleanTerm = term.replace(/[-\s]/g, '');
            return or(
              ilike(books.isbn, `%${cleanTerm}%`),
              ilike(books.barcode, `%${cleanTerm}%`)
            );
          
          case 'author':
            const authorTerm = term.replace(/^(by\s+|author:\s*)/i, '');
            return ilike(books.author, `%${authorTerm.toLowerCase()}%`);
          
          case 'title':
            const titleTerm = term.replace(/^title:\s*/i, '');
            return ilike(books.title, `%${titleTerm.toLowerCase()}%`);
          
          default:
            return or(
              ilike(books.title, searchTerm),
              ilike(books.author, searchTerm),
              ilike(books.description, searchTerm)
            );
        }
      });
      
      conditions.push(or(...searchConditions));
    }

    // Size filter with smart parsing
    if (params.size) {
      const cleanSize = params.size.replace(/\s*pages?\s*/i, '').replace(/\s*-\s*/, '-');
      const sizeRange = cleanSize.split("-").map(s => parseInt(s.trim()));
      if (sizeRange.length === 2 && !sizeRange.some(isNaN)) {
        const [minSize, maxSize] = sizeRange;
        conditions.push(between(books.size, minSize, maxSize));
      } else if (sizeRange.length === 1 && !isNaN(sizeRange[0])) {
        // Single number - treat as "around this size" (±20%)
        const targetSize = sizeRange[0];
        const margin = Math.ceil(targetSize * 0.2);
        conditions.push(between(books.size, targetSize - margin, targetSize + margin));
      }
    }

    // Smart category filter with fuzzy matching
    if (params.categories) {
      const categoryList = params.categories
        .split("+")
        .map(cat => decodeURIComponent(cat.trim()))
        .filter(cat => cat.length > 0);
      
      if (categoryList.length > 0) {
        // Expand category search to include partial matches
        const categoryConditions = categoryList.map(cat => 
          ilike(categories.name, `%${cat}%`)
        );
        conditions.push(or(...categoryConditions));
      }
    }

    // Other filters remain the same
    if (params.available !== undefined && params.available !== "") {
      const available = params.available.toLowerCase() === "true";
      conditions.push(eq(books.available, available));
    }

    if (params.type) {
      const types = params.type.split(",").map(t => t.trim() as "BOOK" | "DOCUMENT" | "PERIODIC" | "ARTICLE");
      const validTypes = types.filter(type => ["BOOK", "DOCUMENT", "PERIODIC", "ARTICLE"].includes(type));
      if (validTypes.length > 0) {
        conditions.push(inArray(books.type, validTypes));
      }
    }

    if (params.language) {
      const languages = params.language.split(",").map(lang => lang.trim());
      conditions.push(inArray(books.language, languages));
    }

    if (params.periodicalFrequency) {
      const frequencies = params.periodicalFrequency.split(",").map(pf => pf.trim());
      conditions.push(inArray(books.periodicalFrequency, frequencies));
    }

    // Combine all conditions
    const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Build base query for counting
    const baseCountQuery = db
      .select({ count: count() })
      .from(books)
      .leftJoin(bookCategories, eq(books.id, bookCategories.bookId))
      .leftJoin(categories, eq(bookCategories.categoryId, categories.id));

    // Get total count
    const totalCountResult = finalCondition 
      ? await baseCountQuery.where(finalCondition)
      : await baseCountQuery;
    
    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Build main query with enhanced relevance scoring
    const baseQuery = db
      .selectDistinct({
        id: books.id,
        title: books.title,
        author: books.author,
        isbn: books.isbn,
        barcode: books.barcode,
        description: books.description,
        language: books.language,
        coverImage: books.coverImage,
        pdfUrl: books.pdfUrl,
        publishedAt: books.publishedAt,
        addedAt: books.addedAt,
        size: books.size,
        available: books.available,
        type: books.type,
        periodicalFrequency: books.periodicalFrequency,
        periodicalIssue: books.periodicalIssue,
        articleJournal: books.articleJournal,
        documentType: books.documentType,
      })
      .from(books)
      .leftJoin(bookCategories, eq(books.id, bookCategories.bookId))
      .leftJoin(categories, eq(bookCategories.categoryId, categories.id))
      .limit(limit)
      .offset(offset);

    // Execute main query
    const results = finalCondition 
      ? await baseQuery.where(finalCondition)
      : await baseQuery;

    // Get categories for each book
    const bookIds = results.map(book => book.id);
    const bookCategoriesData = bookIds.length > 0 ? await db
      .select({
        bookId: bookCategories.bookId,
        categoryName: categories.name,
      })
      .from(bookCategories)
      .leftJoin(categories, eq(bookCategories.categoryId, categories.id))
      .where(inArray(bookCategories.bookId, bookIds)) : [];

    // Group categories by book ID
    const categoriesByBook = bookCategoriesData.reduce((acc, row) => {
      if (!acc[row.bookId]) {
        acc[row.bookId] = [];
      }
      if (row.categoryName) {
        acc[row.bookId].push(row.categoryName);
      }
      return acc;
    }, {} as Record<string, string[]>);

    // Attach categories to books and apply smart sorting
    let booksWithCategories: BookResult[] = results.map((book) => ({
      ...book,
      categories: categoriesByBook[book.id] || []
    }));

    // Apply smart relevance-based sorting
    if (params.sortBy === "relevance" && (processedQuery || originalQuery)) {
      const queryForScoring = processedQuery || originalQuery!;
      booksWithCategories = booksWithCategories
        .map(book => ({
          book,
          score: SmartSearchEngine.calculateRelevanceScore(book, queryForScoring, expandedTerms, searchIntent)
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.book);
    } else {
      // Apply other sorting options
      let orderByField: any;
      const isAsc = params.sortOrder === "asc";
      
      switch (params.sortBy) {
        case "title":
          booksWithCategories.sort((a, b) => 
            isAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
          );
          break;
        case "author":
          booksWithCategories.sort((a, b) => 
            isAsc ? a.author.localeCompare(b.author) : b.author.localeCompare(a.author)
          );
          break;
        case "date":
          booksWithCategories.sort((a, b) => {
            const dateA = a.publishedAt?.getTime() || 0;
            const dateB = b.publishedAt?.getTime() || 0;
            return isAsc ? dateA - dateB : dateB - dateA;
          });
          break;
        case "added":
          booksWithCategories.sort((a, b) => {
            const dateA = a.addedAt.getTime();
            const dateB = b.addedAt.getTime();
            return isAsc ? dateA - dateB : dateB - dateA;
          });
          break;
        case "size":
          booksWithCategories.sort((a, b) => 
            isAsc ? a.size - b.size : b.size - a.size
          );
          break;
        default:
          // Default to newest first
          booksWithCategories.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      }
    }

    // Build response
    const response: SearchResponse = {
      books: booksWithCategories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        appliedFilters: Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== undefined)
        ) as Record<string, string>,
        resultsCount: booksWithCategories.length,
      },
      searchInsights
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error executing search query:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
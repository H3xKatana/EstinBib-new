# EstinBib Digital Library System Diagrams

## Diagram 1 - Database Entity Relationship

```mermaid
erDiagram
    USERS {
        varchar id PK
        varchar name
        varchar email UK
        varchar password
        timestamp emailVerified
        varchar image
        Role role
        EducationYear educationYear
        timestamp createdAt
        timestamp updatedAt
    }
    
    BOOKS {
        varchar id PK
        varchar title
        varchar author
        varchar isbn UK
        varchar barcode UK
        text description
        varchar coverImage
        varchar pdfUrl
        integer size
        boolean available
        timestamp publishedAt
        timestamp addedAt
        varchar language
        BookType type
        varchar periodicalFrequency
        varchar periodicalIssue
        varchar articleJournal
        varchar documentType
    }
    
    CATEGORIES {
        varchar id PK
        varchar name UK
    }
    
    BOOK_CATEGORIES {
        varchar bookId FK
        varchar categoryId FK
    }
    
    BORROWS {
        varchar id PK
        varchar bookId FK
        varchar userId FK
        timestamp borrowedAt
        timestamp dueDate
        timestamp returnedAt
        integer extensionCount
    }
    
    BORROW_EXTENSIONS {
        varchar id PK
        varchar borrowId FK
        timestamp previousDueDate
        timestamp newDueDate
        timestamp requestedAt
        timestamp approvedAt
        varchar approvedBy FK
        text reason
    }
    
    BOOK_REQUESTS {
        varchar id PK
        varchar userId FK
        timestamp requestedAt
        varchar title
        varchar author
        varchar isbn
        timestamp releasedAt
    }
    
    SNDL_DEMANDS {
        varchar id PK
        varchar userId FK
        text requestReason
        SndlDemandStatus status
        text adminNotes
        timestamp requestedAt
        timestamp processedAt
        varchar processedBy FK
    }
    
    COMPLAINTS {
        varchar id PK
        varchar userId FK
        varchar title
        text description
        ComplaintStatus status
        timestamp createdAt
        timestamp updatedAt
        timestamp resolvedAt
        varchar resolvedBy FK
        text adminNotes
        boolean isPrivate
    }
    
    IDEAS {
        varchar id PK
        varchar idea
        varchar userId FK
        timestamp createdAt
    }
    
    CONTACTS {
        varchar id PK
        varchar name
        varchar email
        text message
        timestamp createdAt
    }
    
    ACCOUNTS {
        varchar userId FK
        varchar type
        varchar provider PK
        varchar providerAccountId PK
        text refreshToken
        text accessToken
        integer expiresAt
        varchar tokenType
        varchar scope
        text idToken
        varchar sessionState
        timestamp createdAt
        timestamp updatedAt
    }
    
    VERIFICATION_TOKENS {
        varchar identifier PK
        varchar token PK
        timestamp expires
    }

    USERS ||--o{ BORROWS : "borrows"
    USERS ||--o{ BOOK_REQUESTS : "requests"
    USERS ||--o{ SNDL_DEMANDS : "submits"
    USERS ||--o{ COMPLAINTS : "files"
    USERS ||--o{ IDEAS : "suggests"
    USERS ||--o{ ACCOUNTS : "has"
    USERS ||--o{ BORROW_EXTENSIONS : "approves"
    
    BOOKS ||--o{ BORROWS : "borrowed"
    BOOKS ||--o{ BOOK_CATEGORIES : "categorized"
    
    CATEGORIES ||--o{ BOOK_CATEGORIES : "contains"
    
    BORROWS ||--o{ BORROW_EXTENSIONS : "extended"
```

## Diagram 2 - Web Application Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Next.js Web Application]
        UI[React Components]
        PAGES[Page Routes]
    end
    
    subgraph "API Layer"
        NEXTJS[Next.js API Routes]
        AUTH[Authentication API]
        BOOKS_API[Books API]
        CHAT_API[Chat API]
        DASHBOARD_API[Dashboard API]
        USER_API[User API]
    end
    
    subgraph "Business Logic"
        VECTOR[Vector Operations]
        SEMANTIC[Semantic Analysis]
        TRIGGERS[Special Triggers]
        EMBEDDING[Embedding Cache]
        PDF[PDF Management]
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini AI]
        NEXTAUTH[NextAuth.js]
        GOOGLE[Google OAuth]
        STORAGE[File Storage]
    end
    
    subgraph "Database Layer"
        POSTGRES[(PostgreSQL)]
        DRIZZLE[Drizzle ORM]
    end
    
    WEB --> NEXTJS
    UI --> WEB
    PAGES --> WEB
    
    NEXTJS --> AUTH
    NEXTJS --> BOOKS_API
    NEXTJS --> CHAT_API
    NEXTJS --> DASHBOARD_API
    NEXTJS --> USER_API
    
    CHAT_API --> VECTOR
    CHAT_API --> SEMANTIC
    CHAT_API --> TRIGGERS
    CHAT_API --> EMBEDDING
    
    BOOKS_API --> PDF
    VECTOR --> GEMINI
    AUTH --> NEXTAUTH
    AUTH --> GOOGLE
    PDF --> STORAGE
    
    BOOKS_API --> DRIZZLE
    DASHBOARD_API --> DRIZZLE
    USER_API --> DRIZZLE
    CHAT_API --> DRIZZLE
    
    DRIZZLE --> POSTGRES
```

## Diagram 3 - Authentication Flow with @estin.dz Restriction

```mermaid
sequenceDiagram
    participant U as User
    participant WEB as Web App
    participant AUTH as Auth API
    participant NEXTAUTH as NextAuth
    participant DB as Database
    participant GOOGLE as Google OAuth
    
    U->>WEB: Access protected route
    WEB->>AUTH: Check authentication
    AUTH->>NEXTAUTH: Validate session
    
    alt User not authenticated
        NEXTAUTH-->>AUTH: No valid session
        AUTH-->>WEB: Redirect to login
        WEB-->>U: Show login page
        
        U->>WEB: Choose login method
        alt Google OAuth Login
            WEB->>NEXTAUTH: Initiate Google OAuth
            NEXTAUTH->>GOOGLE: Redirect to Google
            GOOGLE-->>U: Show consent screen
            U->>GOOGLE: Grant permission
            GOOGLE->>NEXTAUTH: Return user profile
            
            alt Email ends with @estin.dz
                NEXTAUTH->>DB: Create/update user with STUDENT role
                DB-->>NEXTAUTH: User data
                NEXTAUTH-->>WEB: Create session
                WEB-->>U: Redirect to dashboard
            else Email not @estin.dz
                NEXTAUTH-->>WEB: Authentication error
                WEB-->>U: Show "Access restricted to @estin.dz emails"
            end
            
        else Credentials Login
            U->>WEB: Enter email/password
            WEB->>AUTH: Validate credentials
            
            alt Email ends with @estin.dz
                AUTH->>DB: Check user credentials
                DB-->>AUTH: User data with role
                AUTH->>NEXTAUTH: Create session
                NEXTAUTH-->>WEB: Session created
                WEB-->>U: Redirect to dashboard
            else Email not @estin.dz
                AUTH-->>WEB: Authentication error
                WEB-->>U: Show "Access restricted to @estin.dz emails"
            end
        end
        
    else User authenticated
        NEXTAUTH-->>AUTH: Valid session with role
        AUTH-->>WEB: User data
        WEB-->>U: Show protected content
    end
```

## Diagram 4 - AI Chat System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Chat API
    participant VEC as Vector Operations
    participant SEM as Semantic Analysis
    participant TRG as Triggers
    participant GEM as Gemini AI
    participant DB as Database
    participant CACHE as Embedding Cache
    
    U->>API: Send chat message
    API->>TRG: Check special triggers
    alt Special trigger found
        TRG-->>API: Return special response
        API-->>U: Special response
    else No special trigger
        API->>SEM: Check inappropriate content
        alt Inappropriate content
            SEM-->>API: Flag as inappropriate
            API-->>U: Inappropriate content response
        else Content appropriate
            API->>DB: Fetch all books with PDF URLs
            DB-->>API: Return books list
            
            alt No books in database
                API-->>U: No books available message
            else Books available
                API->>GEM: Classify topic relevance
                GEM-->>API: Topic relevance score
                
                alt Low relevance score
                    API-->>U: No relevant books message
                else High relevance score
                    API->>VEC: Generate query embedding
                    VEC->>GEM: Request embedding
                    GEM-->>VEC: Return embedding vector
                    VEC-->>API: Query embedding
                    
                    alt Embedding cache empty
                        API->>CACHE: Check book embeddings
                        loop For each book
                            API->>VEC: Generate book embedding
                            VEC->>GEM: Request embedding
                            GEM-->>VEC: Return embedding
                            VEC-->>CACHE: Cache embedding
                        end
                    end
                    
                    API->>VEC: Calculate similarities
                    VEC-->>API: Similarity scores
                    
                    alt No books meet threshold
                        API-->>U: No relevant books found
                    else Relevant books found
                        API->>GEM: Generate contextual response
                        GEM-->>API: AI response with PDF links
                        API-->>U: Response with book recommendations
                    end
                end
            end
        end
    end
```

## Diagram 5 - Digital Book Borrowing Workflow

```mermaid
flowchart TD
    START([User wants to access digital book])
    LOGIN{User logged in with @estin.dz?}
    AUTH[Redirect to authentication]
    SEARCH[Search for book/document]
    SELECT[Select book]
    CHECK_AVAIL{PDF available?}
    CHECK_LIMIT{Under borrow limit?}
    REQUEST_BORROW[Request PDF access]
    LIBRARIAN_APPROVE{Librarian approval needed?}
    AUTO_APPROVE[Auto-approve PDF access]
    MANUAL_APPROVE[Librarian reviews request]
    APPROVED{Request approved?}
    CREATE_BORROW[Create borrow record]
    GRANT_ACCESS[Grant PDF access]
    NOTIFY_USER[Send PDF link to user]
    NOTIFY_REJECT[Notify user of rejection]
    SET_DUE_DATE[Set return due date]
    ACCESS_SUCCESS[User can access PDF]
    BOOK_UNAVAIL[Show PDF unavailable]
    LIMIT_EXCEEDED[Show limit exceeded message]
    
    START --> LOGIN
    LOGIN -->|No| AUTH
    AUTH --> LOGIN
    LOGIN -->|Yes| SEARCH
    SEARCH --> SELECT
    SELECT --> CHECK_AVAIL
    CHECK_AVAIL -->|No| BOOK_UNAVAIL
    CHECK_AVAIL -->|Yes| CHECK_LIMIT
    CHECK_LIMIT -->|No| LIMIT_EXCEEDED
    CHECK_LIMIT -->|Yes| REQUEST_BORROW
    REQUEST_BORROW --> LIBRARIAN_APPROVE
    LIBRARIAN_APPROVE -->|No| AUTO_APPROVE
    LIBRARIAN_APPROVE -->|Yes| MANUAL_APPROVE
    AUTO_APPROVE --> CREATE_BORROW
    MANUAL_APPROVE --> APPROVED
    APPROVED -->|Yes| CREATE_BORROW
    APPROVED -->|No| NOTIFY_REJECT
    CREATE_BORROW --> GRANT_ACCESS
    GRANT_ACCESS --> SET_DUE_DATE
    SET_DUE_DATE --> NOTIFY_USER
    NOTIFY_USER --> ACCESS_SUCCESS
```

## Diagram 6 - Book Content Management System

```mermaid
flowchart TD
    subgraph "Content Upload"
        LIBRARIAN[Librarian Login]
        UPLOAD[Upload Book Content]
        PDF_UPLOAD[Upload PDF File]
        METADATA[Enter Book Metadata]
        COVER[Upload Cover Image]
    end
    
    subgraph "Processing"
        VALIDATE[Validate File Format]
        STORAGE[Store in File System]
        PDF_URL[Generate PDF URL]
        COMPRESS[Compress Images]
        EXTRACT[Extract Text for Search]
    end
    
    subgraph "Database"
        SAVE_BOOK[Save Book Record]
        CATEGORIES[Assign Categories]
        INDEXING[Index for Search]
        EMBEDDING[Generate AI Embeddings]
    end
    
    subgraph "Availability"
        PUBLISH[Mark as Available]
        NOTIFY[Notify Users]
        CATALOG[Add to Catalog]
    end
    
    LIBRARIAN --> UPLOAD
    UPLOAD --> PDF_UPLOAD
    UPLOAD --> METADATA
    UPLOAD --> COVER
    
    PDF_UPLOAD --> VALIDATE
    METADATA --> VALIDATE
    COVER --> COMPRESS
    
    VALIDATE --> STORAGE
    STORAGE --> PDF_URL
    COMPRESS --> STORAGE
    
    PDF_URL --> SAVE_BOOK
    EXTRACT --> INDEXING
    SAVE_BOOK --> CATEGORIES
    CATEGORIES --> EMBEDDING
    
    EMBEDDING --> PUBLISH
    INDEXING --> PUBLISH
    PUBLISH --> NOTIFY
    PUBLISH --> CATALOG
```

## Diagram 7 - Complaint Management System

```mermaid
stateDiagram-v2
    [*] --> Pending : User submits complaint
    
    Pending --> InProgress : Admin starts review
    Pending --> Rejected : Admin rejects complaint
    
    InProgress --> Resolved : Admin resolves issue
    InProgress --> Rejected : Admin determines invalid
    InProgress --> Pending : Need more information
    
    Resolved --> [*] : Complaint closed
    Rejected --> [*] : Complaint closed
    
    note right of Pending
        - User can view status
        - Admin can add notes
        - System tracks timestamps
        - Email notifications sent
    end note
    
    note right of InProgress
        - Admin updates progress
        - Internal notes added
        - User notified of progress
        - Priority levels assigned
    end note
    
    note right of Resolved
        - Resolution notes added
        - User receives notification
        - Complaint archived
        - Satisfaction survey sent
    end note
```

## Diagram 8 - User Role Management

```mermaid
graph TB
    subgraph "User Registration"
        EMAIL_CHECK{Email ends with @estin.dz?}
        ALLOW[Allow Registration]
        DENY[Deny Access]
        DEFAULT_ROLE[Assign STUDENT Role]
    end
    
    subgraph "Role Assignment"
        STUDENT[STUDENT Role]
        LIBRARIAN[LIBRARIAN Role]
        ADMIN_PROMOTE[Admin Promotes User]
    end
    
    subgraph "Permissions"
        STUDENT_PERMS[
            - Browse Books
            - Request PDF Access
            - Submit Complaints
            - Chat with AI
            - Request New Books
        ]
        
        LIBRARIAN_PERMS[
            - All Student Permissions
            - Manage Books & PDFs
            - Approve Borrow Requests
            - Handle Complaints
            - Manage Users
            - Access Analytics
        ]
    end
    
    EMAIL_CHECK -->|Yes| ALLOW
    EMAIL_CHECK -->|No| DENY
    ALLOW --> DEFAULT_ROLE
    DEFAULT_ROLE --> STUDENT
    
    ADMIN_PROMOTE --> LIBRARIAN
    STUDENT --> ADMIN_PROMOTE
    
    STUDENT --> STUDENT_PERMS
    LIBRARIAN --> LIBRARIAN_PERMS
```

## Diagram 9 - Search and Discovery System

```mermaid
graph TB
    subgraph "Search Input"
        USER_QUERY[User Search Query]
        FILTERS[Apply Filters]
        CATEGORIES[Category Selection]
    end
    
    subgraph "Search Processing"
        TEXT_SEARCH[Text-based Search]
        SEMANTIC_SEARCH[AI Semantic Search]
        VECTOR_MATCH[Vector Similarity]
        COMBINE[Combine Results]
    end
    
    subgraph "AI Enhancement"
        GEMINI_EMBED[Generate Query Embedding]
        BOOK_EMBED[Book Embeddings Cache]
        SIMILARITY[Calculate Similarities]
        RANK[Rank by Relevance]
    end
    
    subgraph "Results"
        BOOK_LIST[Filtered Book List]
        PDF_LINKS[Include PDF URLs]
        RECOMMENDATIONS[AI Recommendations]
        PAGINATION[Paginated Results]
    end
    
    USER_QUERY --> TEXT_SEARCH
    USER_QUERY --> SEMANTIC_SEARCH
    FILTERS --> TEXT_SEARCH
    CATEGORIES --> TEXT_SEARCH
    
    SEMANTIC_SEARCH --> GEMINI_EMBED
    GEMINI_EMBED --> VECTOR_MATCH
    VECTOR_MATCH --> BOOK_EMBED
    BOOK_EMBED --> SIMILARITY
    SIMILARITY --> RANK
    
    TEXT_SEARCH --> COMBINE
    RANK --> COMBINE
    
    COMBINE --> BOOK_LIST
    BOOK_LIST --> PDF_LINKS
    BOOK_LIST --> RECOMMENDATIONS
    PDF_LINKS --> PAGINATION
```

## Diagram 10 - System Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "CDN Layer"
            CDN[Content Delivery Network]
        end
        
        subgraph "Load Balancer"
            LB[Load Balancer]
        end
        
        subgraph "Application Servers"
            APP1[Next.js App Instance 1]
            APP2[Next.js App Instance 2]
            APP3[Next.js App Instance 3]
        end
        
        subgraph "Database Cluster"
            PRIMARY[(Primary PostgreSQL)]
            REPLICA1[(Read Replica 1)]
            REPLICA2[(Read Replica 2)]
        end
        
        subgraph "External Services"
            GEMINI_PROD[Google Gemini AI]
            GOOGLE_AUTH[Google OAuth]
            MONITORING[Monitoring & Logging]
        end
        
        subgraph "Storage"
            REDIS[(Redis Cache)]
            PDF_STORAGE[PDF File Storage]
            IMAGE_STORAGE[Image Storage]
        end
    end
    
    CDN --> LB
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> PRIMARY
    APP1 --> REPLICA1
    APP2 --> PRIMARY  
    APP2 --> REPLICA2
    APP3 --> PRIMARY
    APP3 --> REPLICA1
    
    APP1 --> REDIS
    APP2 --> REDIS
    APP3 --> REDIS
    
    APP1 --> PDF_STORAGE
    APP2 --> PDF_STORAGE
    APP3 --> PDF_STORAGE
    
    APP1 --> IMAGE_STORAGE
    APP2 --> IMAGE_STORAGE
    APP3 --> IMAGE_STORAGE
    
    APP1 --> GEMINI_PROD
    APP2 --> GEMINI_PROD
    APP3 --> GEMINI_PROD
    
    APP1 --> GOOGLE_AUTH
    APP2 --> GOOGLE_AUTH
    APP3 --> GOOGLE_AUTH
    
    PRIMARY --> REPLICA1
    PRIMARY --> REPLICA2
    
    APP1 --> MONITORING
    APP2 --> MONITORING
    APP3 --> MONITORING
```

# EstinBib System Diagrams

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
        varchar nfcCardId UK
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

## Diagram 2 - System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        DESKTOP[Desktop App]
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
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini AI]
        NEXTAUTH[NextAuth.js]
        NFC[NFC Card System]
    end
    
    subgraph "Database Layer"
        POSTGRES[(PostgreSQL)]
        DRIZZLE[Drizzle ORM]
    end
    
    WEB --> NEXTJS
    MOBILE --> NEXTJS
    DESKTOP --> NEXTJS
    
    NEXTJS --> AUTH
    NEXTJS --> BOOKS_API
    NEXTJS --> CHAT_API
    NEXTJS --> DASHBOARD_API
    NEXTJS --> USER_API
    
    CHAT_API --> VECTOR
    CHAT_API --> SEMANTIC
    CHAT_API --> TRIGGERS
    CHAT_API --> EMBEDDING
    
    VECTOR --> GEMINI
    AUTH --> NEXTAUTH
    
    BOOKS_API --> DRIZZLE
    DASHBOARD_API --> DRIZZLE
    USER_API --> DRIZZLE
    CHAT_API --> DRIZZLE
    
    DRIZZLE --> POSTGRES
```

## Diagram 3 - AI Chat Sequence

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
            API->>DB: Fetch all books
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
                        GEM-->>API: AI response
                        API-->>U: Response with book recommendations
                    end
                end
            end
        end
    end
```

## Diagram 4 - User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant WEB as Web App
    participant AUTH as Auth API
    participant NEXTAUTH as NextAuth
    participant DB as Database
    participant PROVIDER as OAuth Provider
    
    U->>WEB: Access protected route
    WEB->>AUTH: Check authentication
    AUTH->>NEXTAUTH: Validate session
    
    alt User not authenticated
        NEXTAUTH-->>AUTH: No valid session
        AUTH-->>WEB: Redirect to login
        WEB-->>U: Show login page
        
        U->>WEB: Choose login method
        alt OAuth Login
            WEB->>NEXTAUTH: Initiate OAuth
            NEXTAUTH->>PROVIDER: Redirect to provider
            PROVIDER-->>U: Show consent screen
            U->>PROVIDER: Grant permission
            PROVIDER->>NEXTAUTH: Return authorization code
            NEXTAUTH->>PROVIDER: Exchange for tokens
            PROVIDER-->>NEXTAUTH: Return access token
            NEXTAUTH->>DB: Create/update user
            DB-->>NEXTAUTH: User data
            NEXTAUTH-->>WEB: Create session
        else Email/Password
            U->>WEB: Enter credentials
            WEB->>AUTH: Validate credentials
            AUTH->>DB: Check user credentials
            DB-->>AUTH: User data
            AUTH->>NEXTAUTH: Create session
            NEXTAUTH-->>WEB: Session created
        end
        
        WEB-->>U: Redirect to protected route
    else User authenticated
        NEXTAUTH-->>AUTH: Valid session
        AUTH-->>WEB: User data
        WEB-->>U: Show protected content
    end
```

## Diagram 5 - Book Borrowing Workflow

```mermaid
flowchart TD
    START([User wants to borrow book])
    LOGIN{User logged in?}
    AUTH[Redirect to login]
    SEARCH[Search for book]
    SELECT[Select book]
    CHECK_AVAIL{Book available?}
    CHECK_LIMIT{Under borrow limit?}
    REQUEST_BORROW[Request borrowing]
    LIBRARIAN_APPROVE{Librarian approval needed?}
    AUTO_APPROVE[Auto-approve borrowing]
    MANUAL_APPROVE[Librarian reviews request]
    APPROVED{Request approved?}
    CREATE_BORROW[Create borrow record]
    UPDATE_BOOK[Mark book as unavailable]
    NOTIFY_USER[Notify user of approval]
    NOTIFY_REJECT[Notify user of rejection]
    SET_DUE_DATE[Set due date]
    BORROW_SUCCESS[Borrowing successful]
    BOOK_UNAVAIL[Show book unavailable]
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
    CREATE_BORROW --> UPDATE_BOOK
    UPDATE_BOOK --> SET_DUE_DATE
    SET_DUE_DATE --> NOTIFY_USER
    NOTIFY_USER --> BORROW_SUCCESS
```

## Diagram 6 - Complaint Management System

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
    end note
    
    note right of InProgress
        - Admin updates progress
        - Internal notes added
        - User notified of progress
    end note
    
    note right of Resolved
        - Resolution notes added
        - User receives notification
        - Complaint archived
    end note
```

## Diagram 7 - Deployment Architecture

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
            AUTH_PROVIDER[OAuth Providers]
            MONITORING[Monitoring & Logging]
        end
        
        subgraph "Storage"
            REDIS[(Redis Cache)]
            S3[File Storage]
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
    
    APP1 --> S3
    APP2 --> S3
    APP3 --> S3
    
    APP1 --> GEMINI_PROD
    APP2 --> GEMINI_PROD
    APP3 --> GEMINI_PROD
    
    APP1 --> AUTH_PROVIDER
    APP2 --> AUTH_PROVIDER
    APP3 --> AUTH_PROVIDER
    
    PRIMARY --> REPLICA1
    PRIMARY --> REPLICA2
    
    APP1 --> MONITORING
    APP2 --> MONITORING
    APP3 --> MONITORING
```

## Diagram 8 - API Endpoints Overview

```mermaid
mindmap
    root((EstinBib API))
        Authentication
            /api/auth/signin
            /api/auth/signout
            /api/auth/callback
            /api/auth/session
        Books Management
            /api/books
                GET (list books)
                POST (create book)
            /api/books/[id]
                GET (get book)
                PUT (update book)
                DELETE (delete book)
            /api/books/search
            /api/books/filter
        User Management
            /api/user
                GET (profile)
                PUT (update profile)
            /api/users
                GET (list users)
                POST (create user)
        Dashboard
            /api/dashboard/analytics
            /api/dashboard/books
            /api/dashboard/borrows
            /api/dashboard/users
            /api/dashboard/complaints
            /api/dashboard/requests
            /api/dashboard/sndl
        Chat System
            /api/chat
                POST (chat with AI)
        Categories
            /api/categories
                GET (list categories)
                POST (create category)
        Search & Filter
            /api/search
            /api/filter-data
```

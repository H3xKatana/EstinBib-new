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
        BorrowStatus status
        BorrowType borrowType
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

    PDF_ACCESS_LOGS {
        varchar id PK
        varchar userId FK
        varchar bookId FK
        timestamp accessedAt
        varchar ipAddress
        varchar userAgent
    }

    USERS ||--o{ BORROWS : "borrows"
    USERS ||--o{ BOOK_REQUESTS : "requests"
    USERS ||--o{ SNDL_DEMANDS : "submits"
    USERS ||--o{ COMPLAINTS : "files"
    USERS ||--o{ IDEAS : "suggests"
    USERS ||--o{ ACCOUNTS : "has"
    USERS ||--o{ BORROW_EXTENSIONS : "approves"
    USERS ||--o{ PDF_ACCESS_LOGS : "accesses"
    
    BOOKS ||--o{ BORROWS : "borrowed"
    BOOKS ||--o{ BOOK_CATEGORIES : "categorized"
    BOOKS ||--o{ PDF_ACCESS_LOGS : "accessed"
    
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
        DASHBOARD[User Dashboard]
        BORROW_UI[Borrow Management UI]
    end
    
    subgraph "API Layer"
        NEXTJS[Next.js API Routes]
        AUTH[Authentication API]
        BOOKS_API[Books API]
        CHAT_API[Chat API]
        DASHBOARD_API[Dashboard API]
        USER_API[User API]
        BORROW_API[Borrow Management API]
        PDF_API[PDF Access API]
    end
    
    subgraph "Business Logic"
        VECTOR[Vector Operations]
        SEMANTIC[Semantic Analysis]
        TRIGGERS[Special Triggers]
        EMBEDDING[Embedding Cache]
        PDF[PDF Management]
        BORROW_LOGIC[Borrow Logic]
        ACCESS_CONTROL[Access Control]
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini AI]
        NEXTAUTH[NextAuth.js]
        GOOGLE[Google OAuth]
        CLOUDINARY[Cloudinary Storage]
    end
    
    subgraph "Database Layer"
        POSTGRES[(PostgreSQL)]
        DRIZZLE[Drizzle ORM]
    end
    
    WEB --> NEXTJS
    UI --> WEB
    PAGES --> WEB
    DASHBOARD --> WEB
    BORROW_UI --> WEB
    
    NEXTJS --> AUTH
    NEXTJS --> BOOKS_API
    NEXTJS --> CHAT_API
    NEXTJS --> DASHBOARD_API
    NEXTJS --> USER_API
    NEXTJS --> BORROW_API
    NEXTJS --> PDF_API
    
    CHAT_API --> VECTOR
    CHAT_API --> SEMANTIC
    CHAT_API --> TRIGGERS
    CHAT_API --> EMBEDDING
    
    BOOKS_API --> PDF
    PDF_API --> ACCESS_CONTROL
    BORROW_API --> BORROW_LOGIC
    
    VECTOR --> GEMINI
    AUTH --> NEXTAUTH
    AUTH --> GOOGLE
    PDF --> CLOUDINARY
    
    BOOKS_API --> DRIZZLE
    DASHBOARD_API --> DRIZZLE
    USER_API --> DRIZZLE
    CHAT_API --> DRIZZLE
    BORROW_API --> DRIZZLE
    PDF_API --> DRIZZLE
    
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
        AUTH-->>WEB: User data with @estin.dz domain
        WEB-->>U: Show protected content
    end
```

## Diagram 4 - PDF Access Flow (No Librarian Approval Required)

```mermaid
sequenceDiagram
    participant U as User (@estin.dz)
    participant WEB as Web App
    participant API as PDF API
    participant ACCESS as Access Control
    participant DB as Database
    participant LOG as Access Logger
    participant CLOUD as Cloudinary
    
    U->>WEB: Click PDF access button
    WEB->>API: Request PDF access
    API->>ACCESS: Validate user session
    ACCESS-->>API: Valid @estin.dz user
    
    API->>DB: Check book availability
    DB-->>API: Book data with PDF URL
    
    alt PDF available
        API->>LOG: Log PDF access
        LOG->>DB: Store access record
        API->>CLOUD: Generate secure PDF URL
        CLOUD-->>API: Temporary access URL
        API-->>WEB: Return PDF access URL
        WEB-->>U: Open PDF in new tab/viewer
    else PDF not available
        API-->>WEB: PDF not available message
        WEB-->>U: Show "PDF not available" message
    end
```

## Diagram 5 - Physical Book Borrowing Workflow

```mermaid
flowchart TD
    START([User wants to borrow physical book])
    LOGIN{User logged in with @estin.dz?}
    AUTH[Redirect to authentication]
    SEARCH[Search for book]
    SELECT[Select book]
    CHECK_AVAIL{Physical book available?}
    CHECK_LIMIT{Under borrow limit?}
    REQUEST_BORROW[Request physical book borrow]
    LIBRARIAN_APPROVE{Librarian approval}
    CREATE_BORROW[Create borrow record]
    SET_DUE_DATE[Set return due date - 2 weeks]
    NOTIFY_USER[Notify user - book ready for pickup]
    PICKUP[User picks up book from library]
    ACTIVE_BORROW[Active borrow status]
    EXTENSION_REQ[Extension request]
    RETURN_BOOK[Return physical book]
    COMPLETE_BORROW[Mark borrow as returned]
    BOOK_UNAVAIL[Show book unavailable]
    LIMIT_EXCEEDED[Show limit exceeded message]
    NOTIFY_REJECT[Notify user of rejection]
    
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
    LIBRARIAN_APPROVE -->|Approved| CREATE_BORROW
    LIBRARIAN_APPROVE -->|Rejected| NOTIFY_REJECT
    CREATE_BORROW --> SET_DUE_DATE
    SET_DUE_DATE --> NOTIFY_USER
    NOTIFY_USER --> PICKUP
    PICKUP --> ACTIVE_BORROW
    ACTIVE_BORROW --> EXTENSION_REQ
    ACTIVE_BORROW --> RETURN_BOOK
    EXTENSION_REQ --> ACTIVE_BORROW
    RETURN_BOOK --> COMPLETE_BORROW
```

## Diagram 6 - AI Chat System Flow

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
                    API-->>U: General response with book suggestions
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
                        API-->>U: No specific matches - general books
                    else Relevant books found
                        API->>GEM: Generate contextual response
                        GEM-->>API: AI response with direct PDF links
                        API-->>U: Response with accessible PDFs
                    end
                end
            end
        end
    end
```

## Diagram 7 - Book Content Management System

```mermaid
flowchart TD
    subgraph "Content Upload"
        LIBRARIAN[Librarian Login]
        UPLOAD[Upload Book Content]
        PDF_UPLOAD[Upload PDF File]
        METADATA[Enter Book Metadata]
        COVER[Upload Cover Image]
        PHYSICAL[Mark as Physical/Digital/Both]
    end
    
    subgraph "Processing"
        VALIDATE[Validate File Format]
        CLOUDINARY[Upload to Cloudinary]
        PDF_URL[Generate PDF URL]
        COMPRESS[Compress Images]
        EXTRACT[Extract Text for Search]
        BARCODE[Generate Barcode for Physical]
    end
    
    subgraph "Database"
        SAVE_BOOK[Save Book Record]
        CATEGORIES[Assign Categories]
        INDEXING[Index for Search]
        EMBEDDING[Generate AI Embeddings]
        INVENTORY[Update Inventory Count]
    end
    
    subgraph "Availability"
        PUBLISH[Mark as Available]
        NOTIFY[Notify Users]
        CATALOG[Add to Catalog]
        QR_CODE[Generate QR Code]
    end
    
    LIBRARIAN --> UPLOAD
    UPLOAD --> PDF_UPLOAD
    UPLOAD --> METADATA
    UPLOAD --> COVER
    UPLOAD --> PHYSICAL
    
    PDF_UPLOAD --> VALIDATE
    METADATA --> VALIDATE
    COVER --> COMPRESS
    PHYSICAL --> BARCODE
    
    VALIDATE --> CLOUDINARY
    CLOUDINARY --> PDF_URL
    COMPRESS --> CLOUDINARY
    BARCODE --> SAVE_BOOK
    
    PDF_URL --> SAVE_BOOK
    EXTRACT --> INDEXING
    SAVE_BOOK --> CATEGORIES
    CATEGORIES --> EMBEDDING
    SAVE_BOOK --> INVENTORY
    
    EMBEDDING --> PUBLISH
    INDEXING --> PUBLISH
    INVENTORY --> PUBLISH
    PUBLISH --> NOTIFY
    PUBLISH --> CATALOG
    PUBLISH --> QR_CODE
```

## Diagram 8 - Book Request System

```mermaid
flowchart TD
    START([User wants to request new book])
    LOGIN{User authenticated?}
    AUTH[Redirect to login]
    REQUEST_FORM[Fill Book Request Form]
    
    subgraph "Request Form Fields"
        TITLE[Book Title*]
        AUTHOR[Author Name*]
        ISBN[ISBN - Optional]
        RELEASE_DATE[Expected Release Date]
        ADDITIONAL_INFO[Additional Information]
    end
    
    VALIDATE{Form validation}
    SUBMIT_REQUEST[Submit Request]
    SAVE_DB[Save to Database]
    NOTIFY_USER[Notify User - Request Received]
    
    subgraph "Librarian Review"
        PENDING[Request Status: Pending]
        LIB_REVIEW[Librarian Reviews Request]
        CHECK_CATALOG{Already in catalog?}
        CHECK_AVAILABILITY{Book available for purchase?}
        DECISION{Librarian Decision}
    end
    
    subgraph "Request Processing"
        APPROVE[Approve Request]
        REJECT[Reject Request]
        ORDER_BOOK[Order Physical/Digital Copy]
        ADD_TO_CATALOG[Add Book to Library Catalog]
        UPDATE_STATUS[Update Request Status]
    end
    
    subgraph "User Notifications"
        NOTIFY_APPROVED[Notify: Request Approved]
        NOTIFY_REJECTED[Notify: Request Rejected]
        NOTIFY_AVAILABLE[Notify: Book Now Available]
        TRACK_REQUEST[User Can Track Request Status]
    end
    
    START --> LOGIN
    LOGIN -->|No| AUTH
    AUTH --> LOGIN
    LOGIN -->|Yes| REQUEST_FORM
    
    REQUEST_FORM --> TITLE
    REQUEST_FORM --> AUTHOR
    REQUEST_FORM --> ISBN
    REQUEST_FORM --> RELEASE_DATE
    REQUEST_FORM --> ADDITIONAL_INFO
    
    TITLE --> VALIDATE
    AUTHOR --> VALIDATE
    VALIDATE -->|Invalid| REQUEST_FORM
    VALIDATE -->|Valid| SUBMIT_REQUEST
    
    SUBMIT_REQUEST --> SAVE_DB
    SAVE_DB --> NOTIFY_USER
    NOTIFY_USER --> PENDING
    
    PENDING --> LIB_REVIEW
    LIB_REVIEW --> CHECK_CATALOG
    CHECK_CATALOG -->|Yes| REJECT
    CHECK_CATALOG -->|No| CHECK_AVAILABILITY
    CHECK_AVAILABILITY --> DECISION
    
    DECISION -->|Approve| APPROVE
    DECISION -->|Reject| REJECT
    
    APPROVE --> ORDER_BOOK
    ORDER_BOOK --> ADD_TO_CATALOG
    ADD_TO_CATALOG --> UPDATE_STATUS
    UPDATE_STATUS --> NOTIFY_APPROVED
    NOTIFY_APPROVED --> NOTIFY_AVAILABLE
    
    REJECT --> UPDATE_STATUS
    UPDATE_STATUS --> NOTIFY_REJECTED
    
    NOTIFY_APPROVED --> TRACK_REQUEST
    NOTIFY_REJECTED --> TRACK_REQUEST
    NOTIFY_AVAILABLE --> TRACK_REQUEST
```

## Diagram 9 - Librarian Management Dashboard

```mermaid
flowchart TD
    subgraph "Librarian Dashboard"
        LIB_LOGIN[Librarian Login]
        LIB_OVERVIEW[Library Overview]
        MANAGE_BOOKS[Manage Books]
        MANAGE_BORROWS[Manage Borrows]
        USER_MANAGEMENT[User Management]
        REPORTS[Reports & Analytics]
        COMPLAINTS[Handle Complaints]
    end
    
    subgraph "Book Management"
        ADD_BOOK[Add New Books]
        EDIT_BOOK[Edit Book Details]
        UPLOAD_PDF[Upload PDFs]
        INVENTORY[Inventory Management]
        CATEGORIES[Manage Categories]
        AVAILABILITY[Set Availability]
    end
    
    subgraph "Borrow Management"
        PENDING_REQ[Pending Requests]
        APPROVE_BORROW[Approve Borrows]
        TRACK_RETURNS[Track Returns]
        OVERDUE[Handle Overdue]
        EXTENSIONS[Approve Extensions]
        FINES[Manage Fines]
    end
    
    subgraph "User Management"
        VIEW_USERS[View All Users]
        USER_ACTIVITY[User Activity]
        ROLE_ASSIGN[Assign Roles]
        BLOCK_USER[Block/Unblock Users]
        BORROW_LIMITS[Set Borrow Limits]
    end
    
    subgraph "Analytics"
        BORROW_STATS[Borrowing Statistics]
        POPULAR_BOOKS[Popular Books]
        USER_STATS[User Statistics]
        SYSTEM_USAGE[System Usage]
        REPORTS_GEN[Generate Reports]
    end
    
    LIB_LOGIN --> LIB_OVERVIEW
    LIB_OVERVIEW --> MANAGE_BOOKS
    LIB_OVERVIEW --> MANAGE_BORROWS
    LIB_OVERVIEW --> USER_MANAGEMENT
    LIB_OVERVIEW --> REPORTS
    LIB_OVERVIEW --> COMPLAINTS
    
    MANAGE_BOOKS --> ADD_BOOK
    MANAGE_BOOKS --> EDIT_BOOK
    MANAGE_BOOKS --> UPLOAD_PDF
    MANAGE_BOOKS --> INVENTORY
    MANAGE_BOOKS --> CATEGORIES
    MANAGE_BOOKS --> AVAILABILITY
    
    MANAGE_BORROWS --> PENDING_REQ
    MANAGE_BORROWS --> APPROVE_BORROW
    MANAGE_BORROWS --> TRACK_RETURNS
    MANAGE_BORROWS --> OVERDUE
    MANAGE_BORROWS --> EXTENSIONS
    MANAGE_BORROWS --> FINES
    
    USER_MANAGEMENT --> VIEW_USERS
    USER_MANAGEMENT --> USER_ACTIVITY
    USER_MANAGEMENT --> ROLE_ASSIGN
    USER_MANAGEMENT --> BLOCK_USER
    USER_MANAGEMENT --> BORROW_LIMITS
    
    REPORTS --> BORROW_STATS
    REPORTS --> POPULAR_BOOKS
    REPORTS --> USER_STATS
    REPORTS --> SYSTEM_USAGE
    REPORTS --> REPORTS_GEN
```

## Diagram 10 - Complaint Management System

```mermaid
stateDiagram-v2
    [*] --> Pending : User submits complaint
    
    Pending --> InProgress : Librarian starts review
    Pending --> Rejected : Librarian rejects complaint
    
    InProgress --> Resolved : Librarian resolves issue
    InProgress --> Rejected : Librarian determines invalid
    InProgress --> Pending : Need more information
    
    Resolved --> [*] : Complaint closed
    Rejected --> [*] : Complaint closed
    
    note right of Pending
        - User can view status
        - Librarian can add notes
        - System tracks timestamps
        - Email notifications sent
        - Auto-escalation after 48h
    end note
    
    note right of InProgress
        - Librarian updates progress
        - Internal notes added
        - User notified of progress
        - Priority levels assigned
        - SLA tracking enabled
    end note
    
    note right of Resolved
        - Resolution notes added
        - User receives notification
        - Complaint archived
        - Satisfaction survey sent
        - Resolution time recorded
    end note
```

## Diagram 11 - Search and Discovery System

```mermaid
graph TB
    subgraph "Search Input"
        USER_QUERY[User Search Query]
        FILTERS[Apply Filters]
        CATEGORIES[Category Selection]
        TYPE_FILTER[Digital/Physical Filter]
    end
    
    subgraph "Search Processing"
        TEXT_SEARCH[Text-based Search]
        SEMANTIC_SEARCH[AI Semantic Search]
        VECTOR_MATCH[Vector Similarity]
        COMBINE[Combine Results]
        AVAILABILITY[Check Availability]
    end
    
    subgraph "AI Enhancement"
        GEMINI_EMBED[Generate Query Embedding]
        BOOK_EMBED[Book Embeddings Cache]
        SIMILARITY[Calculate Similarities]
        RANK[Rank by Relevance]
    end
    
    subgraph "Results"
        BOOK_LIST[Filtered Book List]
        PDF_LINKS[Direct PDF Access Links]
        PHYSICAL_STATUS[Physical Copy Status]
        RECOMMENDATIONS[AI Recommendations]
        PAGINATION[Paginated Results]
    end
    
    USER_QUERY --> TEXT_SEARCH
    USER_QUERY --> SEMANTIC_SEARCH
    FILTERS --> TEXT_SEARCH
    CATEGORIES --> TEXT_SEARCH
    TYPE_FILTER --> AVAILABILITY
    
    SEMANTIC_SEARCH --> GEMINI_EMBED
    GEMINI_EMBED --> VECTOR_MATCH
    VECTOR_MATCH --> BOOK_EMBED
    BOOK_EMBED --> SIMILARITY
    SIMILARITY --> RANK
    
    TEXT_SEARCH --> COMBINE
    RANK --> COMBINE
    AVAILABILITY --> COMBINE
    
    COMBINE --> BOOK_LIST
    BOOK_LIST --> PDF_LINKS
    BOOK_LIST --> PHYSICAL_STATUS
    BOOK_LIST --> RECOMMENDATIONS
    PDF_LINKS --> PAGINATION
```

## Diagram 12 - System Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer"
            LB[Load Balancer]
            SSL[SSL Termination]
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
            BACKUP[(Backup Storage)]
        end
        
        subgraph "External Services"
            CLOUDINARY_PROD[Cloudinary CDN]
            GEMINI_PROD[Google Gemini AI]
            GOOGLE_AUTH[Google OAuth]
            MONITORING[Monitoring & Logging]
        end
        
        subgraph "Caching Layer"
            REDIS[(Redis Cache)]
            CDN[Content Delivery Network]
        end
    end
    
    SSL --> LB
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
    
    APP1 --> CLOUDINARY_PROD
    APP2 --> CLOUDINARY_PROD
    APP3 --> CLOUDINARY_PROD
    
    APP1 --> GEMINI_PROD
    APP2 --> GEMINI_PROD
    APP3 --> GEMINI_PROD
    
    APP1 --> GOOGLE_AUTH
    APP2 --> GOOGLE_AUTH
    APP3 --> GOOGLE_AUTH
    
    PRIMARY --> REPLICA1
    PRIMARY --> REPLICA2
    PRIMARY --> BACKUP
    
    APP1 --> MONITORING
    APP2 --> MONITORING
    APP3 --> MONITORING
    
    CDN --> CLOUDINARY_PROD
```


## Diagram 13 - SNDL Request System

```mermaid
stateDiagram-v2
    [*] --> Pending : User submits SNDL request
    
    Pending --> Approved : Librarian approves request
    Pending --> Rejected : Librarian rejects request
    
    Approved --> [*] : Request processed
    Rejected --> [*] : Request closed
    
    note right of Pending
        - User provides request reason
        - System tracks submission time
        - Auto-assigns to librarian queue
        - Email notification sent
        - Status visible to user
    end note
    
    note right of Approved
        - Admin notes added
        - Processing timestamp recorded
        - User receives approval notification
        - Request marked as processed
        - Approved by librarian ID tracked
    end note
    
    note right of Rejected
        - Rejection reason documented
        - Admin notes explaining decision
        - User notified of rejection
        - Processing timestamp recorded
        - Approved by librarian ID tracked
    end note
```

## Diagram 14 - Idea Box System

```mermaid
stateDiagram-v2
    [*] --> Submitted : User submits idea
    
    Submitted --> [*] : Idea stored in system
    
    note right of Submitted
        - Max 500 characters allowed
        - User ID linked for attribution
        - Creation timestamp recorded
        - Ideas visible to librarians
        - No approval workflow needed
    end note
```



// app/catalog/[id]/pdf/page.tsx
import React from "react";
import Link from "next/link";
import { bookDetails } from "@/app/actions/books";
import { Book } from "@/types/_types";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PdfPage({ params }: PageProps) {
    const { id } = await params;
    const book = await bookDetails(id);
    
    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center bg-white p-8 rounded-lg">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Not Found</h1>
                    <p className="text-gray-600 mb-6">The requested book could not be found.</p>
                    <Link
                        href="/catalog"
                        className="inline-block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Back to Catalog
                    </Link>
                </div>
            </div>
        );
    }

    const pdfUrl = (book as unknown as Book).pdfUrl || "none";

    return (
        <div className="bg-gray-50 min-h-[90vh]">
            <div className="mx-auto max-w-7xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {book.title} (PDF View)
                    </h1>
                    <Link
                        href={`/catalog/${id}`}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Back to Details
                    </Link>
                </div>

                {pdfUrl === "none" ? (
                    <div className="border rounded-lg bg-white p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">PDF Not Available</h2>
                        <p className="text-gray-600 mb-6">Sorry, the PDF for this book is not currently available.</p>
                        <Link
                            href={`/catalog/${id}`}
                            className="inline-block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Back to Book Details
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-lg">
                        {/* Option 1: Object tag with parameters to hide toolbar */}
                        <div className="border rounded-lg overflow-hidden">
                            <object
                                data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                type="application/pdf"
                                className="w-full h-[80vh]"
                                style={{ border: 'none' }}
                            >
                                <div className="p-8 text-center text-gray-600">
                                    <p className="mb-4">Your browser doesn't support inline PDF viewing.</p>
                                    <p>Please use a modern browser like Chrome, Firefox, or Safari.</p>
                                </div>
                            </object>
                        </div>

                        {/* Option 2: Embed tag alternative */}
                        {/* 
                        <div className="border rounded-lg overflow-hidden">
                            <embed
                                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                type="application/pdf"
                                className="w-full h-[85vh]"
                                style={{ border: 'none' }}
                            />
                        </div>
                        */}

                        {/* Option 3: For better control, you can set up PDF.js */}
                        {/* 
                        Instructions for PDF.js setup:
                        1. Download PDF.js from: https://github.com/mozilla/pdf.js/releases
                        2. Extract to public/pdfjs/ folder
                        3. Use this iframe:
                        
                        <div className="border rounded-lg overflow-hidden">
                            <iframe
                                src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
                                className="w-full h-[70vh]"
                                title={`${book.title} PDF`}
                                style={{ border: 'none' }}
                            />
                        </div>
                        */}
                    </div>
                )}
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PlusCircleIcon, DocumentIcon, XCircleIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [url, setUrl] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [tags, setTags] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'url'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  
  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, selectedTags]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/kb/documents', {
        params: {
          search: searchQuery || undefined,
          tags: selectedTags.length ? selectedTags : undefined,
          skip: 0,
          limit: 100
        }
      });
      setDocuments(response.data.items);
      setTotalDocuments(response.data.total);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    onDrop: acceptedFiles => {
      uploadFiles(acceptedFiles);
    },
  });

  const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    if (tags) {
      formData.append('tags', tags);
    }

    try {
      // Initialize progress tracker for each file
      const progressTracker = {};
      files.forEach(file => {
        progressTracker[file.name] = 0;
      });
      setUploadProgress(progressTracker);

      const response = await axios.post('/api/kb/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Update progress for all files (we can't track individual files in this simple implementation)
          const updatedProgress = {};
          files.forEach(file => {
            updatedProgress[file.name] = percentCompleted;
          });
          setUploadProgress(updatedProgress);
        }
      });

      // Update document list after successful upload
      fetchDocuments();
      
      // Clear tags input
      setTags('');
      
    } catch (error) {
      console.error('Error uploading files:', error);
      // Reset progress on error
      setUploadProgress({});
    }
  };

  const handleUrlImport = async (e) => {
    e.preventDefault();
    if (!url) return;

    try {
      setIsLoading(true);
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
      
      const response = await axios.post('/api/kb/url', {
        url,
        title: urlTitle || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined
      });

      // Clear form and update document list on success
      setUrl('');
      setUrlTitle('');
      setTags('');
      fetchDocuments();
      
    } catch (error) {
      console.error('Error importing URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(`/api/kb/documents/${docId}`);
      // Update the document list
      setDocuments(documents.filter(doc => doc.id !== docId));
      setTotalDocuments(prev => prev - 1);
    } catch (error) {
      console.error(`Error deleting document ${docId}:`, error);
    }
  };

  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Extract all unique tags from documents
  const allTags = [...new Set(documents.flatMap(doc => doc.tags || []))];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage documents and web content for your AI assistant to access.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`${activeTab === 'upload'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('upload')}
              >
                Upload Documents
              </button>
              <button
                className={`${activeTab === 'url'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('url')}
              >
                Import URL
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'upload' && (
              <div>
                <div {...getRootProps()} className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                  <div className="space-y-1 text-center">
                    <PlusCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" {...getInputProps()} />
                      <p className="pl-1">
                        <span className="font-medium text-primary-600 hover:text-primary-500">
                          Click to upload
                        </span>
                        {' '}or drag and drop PDF, DOCX, or TXT files
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">Up to 10MB per file</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="project, research, reference"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                {/* Show upload progress if any */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
                    {Object.entries(uploadProgress).map(([filename, progress]) => (
                      <div key={filename} className="mt-2">
                        <div className="text-xs text-gray-500">{filename}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary-600 h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'url' && (
              <form onSubmit={handleUrlImport}>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="url-title" className="block text-sm font-medium text-gray-700">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    id="url-title"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Article Title"
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="url-tags" className="block text-sm font-medium text-gray-700">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="url-tags"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="project, research, reference"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isLoading || !url}
                  >
                    {isLoading ? 'Importing...' : 'Import URL'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="mt-8">
        <div className="md:flex md:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Documents ({totalDocuments})
          </h2>
          <div className="mt-2 md:mt-0 md:flex space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <input
                type="text"
                className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm ${selectedTags.includes(tag)
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                <TagIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm text-red-800 bg-red-100 hover:bg-red-200"
              >
                <XCircleIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="mt-4 flex justify-center">
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : documents.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <DocumentIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {doc.tags && doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="ml-4 text-gray-400 hover:text-red-600 focus:outline-none"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">
                {searchQuery || selectedTags.length > 0
                  ? 'No documents match your search criteria.'
                  : 'No documents in your knowledge base yet. Start by uploading some documents or importing web content.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

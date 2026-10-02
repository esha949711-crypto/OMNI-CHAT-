import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  HardDrive,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Image as ImageIcon,
  File as GenericFile,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Check,
  CloudUpload,
  Paperclip,
  Loader2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  initAuth,
  getAccessToken,
} from '../services/googleAuth';
import {
  DriveFileItem,
  listDriveFiles,
  fetchDriveFileContent,
  saveFileToGoogleDrive,
  deleteDriveFile,
} from '../services/googleDrive';
import { ChatAttachment, ThemeMode } from '../types/chat';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onAttachFileToChat?: (attachment: ChatAttachment) => void;
  activeChatTitle?: string;
  activeChatContent?: string;
}

export const DriveModal: React.FC<DriveModalProps> = ({
  isOpen,
  onClose,
  theme,
  onAttachFileToChat,
  activeChatTitle,
  activeChatContent,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Files state
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filesError, setFilesError] = useState<string | null>(null);

  // Attaching state
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [attachedSuccessId, setAttachedSuccessId] = useState<string | null>(null);

  // Save chat to drive state
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [saveChatSuccess, setSaveChatSuccess] = useState<string | null>(null);

  // Destructive delete confirmation modal state (MANDATORY per workspace integration guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when token is available or search changes
  const loadFiles = useCallback(
    async (query?: string) => {
      let activeToken = token;
      if (!activeToken) {
        activeToken = await getAccessToken();
      }
      if (!activeToken) return;

      setIsLoadingFiles(true);
      setFilesError(null);
      try {
        const response = await listDriveFiles(activeToken, query);
        setFiles(response.files || []);
      } catch (err: any) {
        console.error('Failed to list files:', err);
        setFilesError(err.message || 'Unable to retrieve Google Drive files.');
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (isOpen && currentUser && token) {
      loadFiles(searchQuery);
    }
  }, [isOpen, currentUser, token, loadFiles, searchQuery]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        loadFiles();
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Sign in was cancelled or failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setToken(null);
      setFiles([]);
    } catch (err: any) {
      console.error('Sign out failed:', err);
    }
  };

  // Handle file selection and attachment to chat
  const handleSelectFile = async (file: DriveFileItem) => {
    if (!token || !onAttachFileToChat) return;

    setAttachingId(file.id);
    try {
      const result = await fetchDriveFileContent(token, file);
      
      const attachment: ChatAttachment = {
        id: `drive-${file.id}-${Date.now()}`,
        name: file.name,
        mimeType: result.mimeType,
        data: result.text,
        size: file.size ? Number(file.size) : undefined,
      };

      onAttachFileToChat(attachment);
      setAttachedSuccessId(file.id);
      setTimeout(() => setAttachedSuccessId(null), 2500);
    } catch (err: any) {
      console.error('Failed to attach file:', err);
      alert(`Could not read file from Google Drive: ${err.message}`);
    } finally {
      setAttachingId(null);
    }
  };

  // Handle saving the current conversation directly to Google Drive
  const handleSaveChatToDrive = async () => {
    if (!token || !activeChatContent) return;

    setIsSavingChat(true);
    setSaveChatSuccess(null);
    try {
      const safeTitle = (activeChatTitle || 'OmniChat-Conversation')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const filename = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.md`;

      const created = await saveFileToGoogleDrive(token, {
        name: filename,
        content: activeChatContent,
        mimeType: 'text/markdown',
        description: `Exported conversation from OmniChat: ${activeChatTitle || 'Chat Session'}`,
      });

      setSaveChatSuccess(created.webViewLink || 'Saved to Google Drive');
      // Refresh list
      loadFiles(searchQuery);
    } catch (err: any) {
      console.error('Failed to save chat to Google Drive:', err);
      alert(`Error saving chat: ${err.message}`);
    } finally {
      setIsSavingChat(false);
    }
  };

  // Destructive delete operation with mandatory confirmation
  const handleConfirmDelete = async () => {
    if (!token || !fileToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDriveFile(token, fileToDelete.id);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for file type icon
  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
    if (mimeType === 'application/vnd.google-apps.presentation') {
      return <Presentation className="w-5 h-5 text-amber-500 shrink-0" />;
    }
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-purple-400 shrink-0" />;
    }
    if (
      mimeType.includes('json') ||
      mimeType.includes('javascript') ||
      mimeType.includes('typescript') ||
      name.endsWith('.ts') ||
      name.endsWith('.js') ||
      name.endsWith('.py')
    ) {
      return <FileCode className="w-5 h-5 text-sky-400 shrink-0" />;
    }
    return <GenericFile className="w-5 h-5 text-slate-400 shrink-0" />;
  };

  // Format file size
  const formatSize = (bytes?: string) => {
    if (!bytes) return '';
    const num = Number(bytes);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-[#111422] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            theme === 'dark' ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 flex items-center justify-center border border-blue-500/30">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Google Drive Integration</h2>
              <p className="text-xs text-slate-400">
                Browse, attach documents into chat, or save discussions directly to your Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === 'dark'
                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!currentUser ? (
            /* Unauthenticated State */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <HardDrive className="w-8 h-8 text-blue-400" />
              </div>

              <h3 className="text-lg font-semibold mb-2">Connect Google Drive</h3>
              <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                Link your Google account to bring files, Google Docs, Sheets, and presentations into
                OmniChat. Analyze documents with Gemini 3.8 Flash, or save entire conversations to
                Drive with permission.
              </p>

              {/* Official Google Sign-In button per guidelines */}
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-medium text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>{isAuthenticating ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>

              {authError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs max-w-sm">
                  {authError}
                </div>
              )}
            </div>
          ) : (
            /* Authenticated Drive Browser */
            <div className="space-y-4">
              {/* Account Status & Top Actions */}
              <div
                className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-8 h-8 rounded-full border border-blue-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {currentUser.displayName || 'Google Account'}
                    </div>
                    <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Save Active Chat to Drive */}
                  {activeChatContent && (
                    <button
                      onClick={handleSaveChatToDrive}
                      disabled={isSavingChat}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
                      title="Save current chat conversation to Google Drive as Markdown"
                    >
                      {isSavingChat ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CloudUpload className="w-3.5 h-3.5" />
                      )}
                      <span>Save Chat to Drive</span>
                    </button>
                  )}

                  {/* Refresh Files */}
                  <button
                    onClick={() => loadFiles(searchQuery)}
                    disabled={isLoadingFiles}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Refresh Drive Files"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-colors"
                    title="Disconnect Google Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification when chat was successfully saved to Drive */}
              {saveChatSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Conversation successfully saved to your Google Drive!</span>
                  </div>
                  {saveChatSuccess.startsWith('http') && (
                    <a
                      href={saveChatSuccess}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold hover:text-emerald-300 flex items-center space-x-1"
                    >
                      <span>Open File</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files in Google Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Files Error */}
              {filesError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {filesError}
                </div>
              )}

              {/* Files List */}
              <div className="space-y-1.5 min-h-[250px]">
                {isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    <span className="text-xs">Loading Google Drive files...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                    <HardDrive className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-xs">No files found matching your search.</p>
                  </div>
                ) : (
                  files.map((file) => {
                    const isAttaching = attachingId === file.id;
                    const isAttached = attachedSuccessId === file.id;

                    return (
                      <div
                        key={file.id}
                        className={`group p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {getFileIcon(file.mimeType, file.name)}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-slate-200 truncate">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                              {file.size && <span>{formatSize(file.size)}</span>}
                              {file.modifiedTime && (
                                <span>
                                  {new Date(file.modifiedTime).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {/* Attach into Chat */}
                          {onAttachFileToChat && (
                            <button
                              onClick={() => handleSelectFile(file)}
                              disabled={isAttaching}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                                isAttached
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              } disabled:opacity-50`}
                              title="Attach file content to AI conversation"
                            >
                              {isAttaching ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isAttached ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Paperclip className="w-3 h-3" />
                              )}
                              <span>{isAttached ? 'Attached!' : 'Attach'}</span>
                            </button>
                          )}

                          {/* Open in Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                theme === 'dark'
                                  ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                  : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Delete File (Triggers Mandatory User Confirmation Dialog) */}
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete file from Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs text-slate-400 shrink-0 ${
            theme === 'dark' ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <span>Powered by official Google Drive API v3</span>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY Explicit Confirmation Dialog for Destructive Operations */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md p-5 rounded-2xl border shadow-2xl space-y-4 ${
              theme === 'dark'
                ? 'bg-[#181c2e] border-slate-700 text-slate-100'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Delete Google Drive File?</h3>
                <p className="text-xs text-slate-400">This action permanently deletes the file from Drive.</p>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs ${
                theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="font-semibold text-slate-200">{fileToDelete.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Type: {fileToDelete.mimeType} {fileToDelete.size ? `• ${formatSize(fileToDelete.size)}` : ''}
              </div>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  theme === 'dark'
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

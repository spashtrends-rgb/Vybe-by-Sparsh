import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/driveAuth.ts';
import {
  fetchAppProjectFiles,
  createGoogleDriveFolder,
  uploadSingleFileToDrive,
  type AppFileItem,
  type UploadProgress,
} from '../services/driveUploader.ts';
import {
  FolderUp,
  FolderCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCode,
  HardDrive,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [files, setFiles] = useState<AppFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [loadFilesError, setLoadFilesError] = useState<string | null>(null);

  const [folderName, setFolderName] = useState<string>(
    `vybe-by-sparsh-backup-${new Date().toISOString().slice(0, 10)}`
  );

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadState, setUploadState] = useState<UploadProgress>({
    total: 0,
    completed: 0,
    currentFile: '',
    status: 'idle',
    fileStatuses: {},
  });

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        // Not signed in or needs token refresh
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch app files list when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setLoadFilesError(null);
    try {
      const fetched = await fetchAppProjectFiles();
      setFiles(fetched);
    } catch (err: any) {
      setLoadFilesError(err.message || 'Failed to list application files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Could not complete Google Sign-in. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setUploadState({
        total: 0,
        completed: 0,
        currentFile: '',
        status: 'idle',
        fileStatuses: {},
      });
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const initiateUploadFlow = () => {
    if (!token) {
      handleSignIn();
      return;
    }
    if (files.length === 0) {
      loadFiles();
      return;
    }
    // Show mandatory user confirmation dialog
    setShowConfirmDialog(true);
  };

  const executeUploadAll = async () => {
    setShowConfirmDialog(false);
    if (!token) {
      setAuthError('Authentication token missing. Please sign in again.');
      return;
    }

    const initialStatuses: Record<string, 'pending' | 'uploading' | 'done' | 'failed'> = {};
    files.forEach((f) => {
      initialStatuses[f.path] = 'pending';
    });

    setUploadState({
      total: files.length,
      completed: 0,
      currentFile: 'Creating Google Drive folder...',
      status: 'uploading',
      fileStatuses: initialStatuses,
    });

    try {
      // 1. Create target folder on Google Drive
      const createdFolder = await createGoogleDriveFolder(token, folderName.trim() || 'vybe-by-sparsh-files');
      
      setUploadState((prev) => ({
        ...prev,
        folderId: createdFolder.id,
        folderName: createdFolder.name,
        folderUrl: createdFolder.folderUrl,
      }));

      // 2. Upload each file sequentially
      let completedCount = 0;
      for (const fileItem of files) {
        setUploadState((prev) => ({
          ...prev,
          currentFile: fileItem.path,
          fileStatuses: { ...prev.fileStatuses, [fileItem.path]: 'uploading' },
        }));

        try {
          // Fetch content for the file from the server
          await uploadSingleFileToDrive(
            token,
            createdFolder.id,
            fileItem,
            (fileItem as any).content || ''
          );

          completedCount++;
          setUploadState((prev) => ({
            ...prev,
            completed: completedCount,
            fileStatuses: { ...prev.fileStatuses, [fileItem.path]: 'done' },
          }));
        } catch (fileErr: any) {
          console.error(`Failed to upload ${fileItem.path}:`, fileErr);
          setUploadState((prev) => ({
            ...prev,
            fileStatuses: { ...prev.fileStatuses, [fileItem.path]: 'failed' },
          }));
        }
      }

      setUploadState((prev) => ({
        ...prev,
        status: 'completed',
        currentFile: '',
      }));
    } catch (uploadErr: any) {
      console.error('Upload flow error:', uploadErr);
      setUploadState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: uploadErr.message || 'Error uploading files to Google Drive.',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Google Drive Backup
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  OAuth 2.0
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Upload all files and source code of this app into a folder on your Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Authentication Card */}
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-750">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-white">
                    {user ? user.displayName || user.email : 'Google Account'}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {user
                      ? `Connected: ${user.email}`
                      : 'Sign in to access your Google Drive and upload files.'}
                  </div>
                </div>
              </div>

              <div>
                {user && token ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                ) : (
                  /* Official Google Sign-In Button format from skill instructions */
                  <button
                    onClick={handleSignIn}
                    disabled={isAuthLoading}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-100 shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                    ) : (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
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
                    <span>Sign in with Google</span>
                  </button>
                )}
              </div>
            </div>

            {authError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Folder Name Configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Target Google Drive Folder Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                disabled={uploadState.status === 'uploading'}
                placeholder="e.g. vybe-by-sparsh-app-files"
                className="flex-1 px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                onClick={loadFiles}
                disabled={isLoadingFiles || uploadState.status === 'uploading'}
                title="Refresh file list"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              A new folder with this name will be created in your root Google Drive, containing all application files.
            </p>
          </div>

          {/* App Files Discovered */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">
                Application Files ({files.length} ready)
              </span>
              <span>
                Total size: {(files.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-2 divide-y divide-zinc-800/50">
              {isLoadingFiles ? (
                <div className="py-6 flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Scanning project files...</span>
                </div>
              ) : loadFilesError ? (
                <div className="p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loadFilesError}</span>
                </div>
              ) : files.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No files found to upload.
                </div>
              ) : (
                files.map((file) => {
                  const status = uploadState.fileStatuses[file.path] || 'pending';
                  return (
                    <div
                      key={file.path}
                      className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-zinc-900/60 rounded"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 font-mono text-[11px] truncate">
                          {file.path}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="text-[10px] text-zinc-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        {status === 'done' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {status === 'uploading' && (
                          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        )}
                        {status === 'failed' && (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        {status === 'pending' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upload Progress & Success Card */}
          {uploadState.status === 'uploading' && (
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300 font-medium flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading to Google Drive...
                </span>
                <span className="text-blue-400 font-mono text-xs">
                  {uploadState.completed} / {uploadState.total} files (
                  {Math.round((uploadState.completed / (uploadState.total || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round(
                      (uploadState.completed / (uploadState.total || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
              {uploadState.currentFile && (
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  Current: {uploadState.currentFile}
                </p>
              )}
            </div>
          )}

          {uploadState.status === 'completed' && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-medium text-sm">
                  <FolderCheck className="w-5 h-5 text-emerald-400" />
                  <span>All files uploaded successfully!</span>
                </div>
                <span className="text-xs text-emerald-400/80 font-mono">
                  {uploadState.completed} files saved
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Created folder <strong className="text-white">"{uploadState.folderName}"</strong> on your Google Drive.
              </p>
              {uploadState.folderUrl && (
                <a
                  href={uploadState.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Folder in Google Drive
                </a>
              )}
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300">Upload Incomplete</h4>
                <p className="text-xs text-red-400 mt-1">{uploadState.errorMessage}</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {user ? `Signed in as ${user.email}` : 'Requires Google Sign In'}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>

            {user && token ? (
              <button
                onClick={initiateUploadFlow}
                disabled={
                  uploadState.status === 'uploading' ||
                  files.length === 0 ||
                  isLoadingFiles
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {uploadState.status === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading ({uploadState.completed}/{uploadState.total})...</span>
                  </>
                ) : (
                  <>
                    <FolderUp className="w-4 h-4" />
                    <span>Upload All Files to Google Drive</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Mandatory User Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <FolderUp className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Google Drive Upload</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to create a new folder named <strong className="text-white">"{folderName}"</strong> on your Google Drive and upload all <strong className="text-white">{files.length} application files</strong>?
            </p>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div>• Destination: Google Drive ({user?.email})</div>
              <div>• File count: {files.length} items (Source code, configs, styles)</div>
              <div>• Total payload: ~{(files.reduce((a, b) => a + b.size, 0) / 1024).toFixed(1)} KB</div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeUploadAll}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Yes, Upload to Google Drive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

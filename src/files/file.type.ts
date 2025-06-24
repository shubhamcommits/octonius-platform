import { FileCode } from './file.code'

export interface FileResponse<T> {
    success: true
    message: FileCode
    code: number
    file: T
}

export interface FilesResponse<T> {
    success: true
    message: FileCode
    code: number
    files: T
}

export interface FileError {
    success: false
    message: FileCode
    code: number
    stack: Error
} 
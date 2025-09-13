import { createClient } from '@supabase/supabase-js'
import { sanitizeFileName, isAllowedFileType, isAllowedFileSize } from './security'

// 创建 Supabase 客户端
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 存储桶配置
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'media',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain'
  ],
  FOLDERS: {
    NEWS_COVERS: 'news/covers',
    SHARESPEARE_MEDIA: 'sharespeare/media',
    AVATARS: 'users/avatars',
    DOCUMENTS: 'documents',
    TEMP: 'temp'
  }
}

// 文件上传结果类型
export interface UploadResult {
  success: boolean
  data?: {
    path: string
    publicUrl: string
    signedUrl?: string
  }
  error?: string
}

// 文件删除结果类型
export interface DeleteResult {
  success: boolean
  error?: string
}

// 签名URL结果类型
export interface SignedUrlResult {
  success: boolean
  data?: {
    signedUrl: string
    expiresAt: string
  }
  error?: string
}

// 上传文件到 Supabase Storage
export async function uploadFile(
  file: File,
  folder: string,
  userId: string,
  customFileName?: string
): Promise<UploadResult> {
  try {
    // 验证文件类型
    if (!isAllowedFileType(file.type)) {
      return {
        success: false,
        error: `不支持的文件类型: ${file.type}`
      }
    }
    
    // 验证文件大小
    if (!isAllowedFileSize(file.size)) {
      return {
        success: false,
        error: `文件大小超过限制 (${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`
      }
    }
    
    const supabase = createSupabaseClient()
    
    // 生成文件名
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || ''
    const fileName = customFileName 
      ? sanitizeFileName(`${customFileName}.${fileExtension}`)
      : sanitizeFileName(`${timestamp}_${file.name}`)
    
    const filePath = `${folder}/${userId}/${fileName}`
    
    // 上传文件
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('文件上传失败:', error)
      return {
        success: false,
        error: `文件上传失败: ${error.message}`
      }
    }
    
    // 获取公开URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(filePath)
    
    return {
      success: true,
      data: {
        path: filePath,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error) {
    console.error('上传文件时发生错误:', error)
    return {
      success: false,
      error: '上传文件时发生错误'
    }
  }
}

// 删除文件
export async function deleteFile(filePath: string): Promise<DeleteResult> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([filePath])
    
    if (error) {
      console.error('文件删除失败:', error)
      return {
        success: false,
        error: `文件删除失败: ${error.message}`
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('删除文件时发生错误:', error)
    return {
      success: false,
      error: '删除文件时发生错误'
    }
  }
}

// 批量删除文件
export async function deleteFiles(filePaths: string[]): Promise<DeleteResult> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove(filePaths)
    
    if (error) {
      console.error('批量删除文件失败:', error)
      return {
        success: false,
        error: `批量删除文件失败: ${error.message}`
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('批量删除文件时发生错误:', error)
    return {
      success: false,
      error: '批量删除文件时发生错误'
    }
  }
}

// 生成签名URL（用于私有文件访问）
export async function createSignedUrl(
  filePath: string,
  expiresIn: number = 3600 // 默认1小时
): Promise<SignedUrlResult> {
  try {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)
    
    if (error || !data) {
      console.error('生成签名URL失败:', error)
      return {
        success: false,
        error: `生成签名URL失败: ${error?.message || '未知错误'}`
      }
    }
    
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    
    return {
      success: true,
      data: {
        signedUrl: data.signedUrl,
        expiresAt
      }
    }
  } catch (error) {
    console.error('生成签名URL时发生错误:', error)
    return {
      success: false,
      error: '生成签名URL时发生错误'
    }
  }
}

// 批量生成签名URL
export async function createSignedUrls(
  filePaths: string[],
  expiresIn: number = 3600
): Promise<{
  success: boolean
  data?: Array<{ path: string; signedUrl: string; expiresAt: string }>
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    const results = await Promise.all(
      filePaths.map(async (path) => {
        const { data, error } = await supabase.storage
          .from(STORAGE_CONFIG.BUCKET_NAME)
          .createSignedUrl(path, expiresIn)
        
        if (error || !data) {
          return null
        }
        
        return {
          path,
          signedUrl: data.signedUrl,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        }
      })
    )
    
    const validResults = results.filter(result => result !== null)
    
    return {
      success: true,
      data: validResults as Array<{ path: string; signedUrl: string; expiresAt: string }>
    }
  } catch (error) {
    console.error('批量生成签名URL时发生错误:', error)
    return {
      success: false,
      error: '批量生成签名URL时发生错误'
    }
  }
}

// 获取文件信息
export async function getFileInfo(filePath: string): Promise<{
  success: boolean
  data?: {
    name: string
    size: number
    mimeType: string
    lastModified: string
    publicUrl: string
  }
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    // 获取文件列表来获取文件信息
    const pathParts = filePath.split('/')
    const fileName = pathParts.pop()
    const folderPath = pathParts.join('/')
    
    const { data: files, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list(folderPath, {
        limit: 100,
        search: fileName
      })
    
    if (error) {
      return {
        success: false,
        error: `获取文件信息失败: ${error.message}`
      }
    }
    
    const file = files?.find(f => f.name === fileName)
    
    if (!file) {
      return {
        success: false,
        error: '文件不存在'
      }
    }
    
    // 获取公开URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(filePath)
    
    return {
      success: true,
      data: {
        name: file.name,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        lastModified: file.updated_at || file.created_at,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error) {
    console.error('获取文件信息时发生错误:', error)
    return {
      success: false,
      error: '获取文件信息时发生错误'
    }
  }
}

// 列出文件夹中的文件
export async function listFiles(
  folder: string,
  options: {
    limit?: number
    offset?: number
    search?: string
  } = {}
): Promise<{
  success: boolean
  data?: Array<{
    name: string
    path: string
    size: number
    mimeType: string
    lastModified: string
    publicUrl: string
  }>
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    const { data: files, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list(folder, {
        limit: options.limit || 50,
        offset: options.offset || 0,
        search: options.search
      })
    
    if (error) {
      return {
        success: false,
        error: `列出文件失败: ${error.message}`
      }
    }
    
    const fileList = files?.map(file => {
      const filePath = `${folder}/${file.name}`
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .getPublicUrl(filePath)
      
      return {
        name: file.name,
        path: filePath,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        lastModified: file.updated_at || file.created_at,
        publicUrl: publicUrlData.publicUrl
      }
    }) || []
    
    return {
      success: true,
      data: fileList
    }
  } catch (error) {
    console.error('列出文件时发生错误:', error)
    return {
      success: false,
      error: '列出文件时发生错误'
    }
  }
}

// 移动文件
export async function moveFile(
  fromPath: string,
  toPath: string
): Promise<{
  success: boolean
  data?: { newPath: string; publicUrl: string }
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .move(fromPath, toPath)
    
    if (error) {
      return {
        success: false,
        error: `移动文件失败: ${error.message}`
      }
    }
    
    // 获取新的公开URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(toPath)
    
    return {
      success: true,
      data: {
        newPath: toPath,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error) {
    console.error('移动文件时发生错误:', error)
    return {
      success: false,
      error: '移动文件时发生错误'
    }
  }
}

// 复制文件
export async function copyFile(
  fromPath: string,
  toPath: string
): Promise<{
  success: boolean
  data?: { newPath: string; publicUrl: string }
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .copy(fromPath, toPath)
    
    if (error) {
      return {
        success: false,
        error: `复制文件失败: ${error.message}`
      }
    }
    
    // 获取新的公开URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(toPath)
    
    return {
      success: true,
      data: {
        newPath: toPath,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error) {
    console.error('复制文件时发生错误:', error)
    return {
      success: false,
      error: '复制文件时发生错误'
    }
  }
}

// 清理临时文件（删除超过24小时的临时文件）
export async function cleanupTempFiles(): Promise<DeleteResult> {
  try {
    const supabase = createSupabaseClient()
    
    // 列出临时文件夹中的所有文件
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list(STORAGE_CONFIG.FOLDERS.TEMP, {
        limit: 1000
      })
    
    if (listError) {
      return {
        success: false,
        error: `列出临时文件失败: ${listError.message}`
      }
    }
    
    if (!files || files.length === 0) {
      return { success: true }
    }
    
    // 筛选出超过24小时的文件
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const oldFiles = files.filter(file => {
      const fileDate = new Date(file.created_at)
      return fileDate < oneDayAgo
    })
    
    if (oldFiles.length === 0) {
      return { success: true }
    }
    
    // 删除过期文件
    const filePaths = oldFiles.map(file => `${STORAGE_CONFIG.FOLDERS.TEMP}/${file.name}`)
    
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove(filePaths)
    
    if (deleteError) {
      return {
        success: false,
        error: `删除临时文件失败: ${deleteError.message}`
      }
    }
    
    console.log(`已清理 ${oldFiles.length} 个临时文件`)
    return { success: true }
  } catch (error) {
    console.error('清理临时文件时发生错误:', error)
    return {
      success: false,
      error: '清理临时文件时发生错误'
    }
  }
}

// 获取存储使用情况统计
export async function getStorageStats(): Promise<{
  success: boolean
  data?: {
    totalFiles: number
    totalSize: number
    folderStats: Record<string, { files: number; size: number }>
  }
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    const folderStats: Record<string, { files: number; size: number }> = {}
    let totalFiles = 0
    let totalSize = 0
    
    // 遍历所有文件夹
    for (const [folderName, folderPath] of Object.entries(STORAGE_CONFIG.FOLDERS)) {
      const { data: files, error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .list(folderPath, {
          limit: 1000
        })
      
      if (error) {
        console.warn(`获取文件夹 ${folderPath} 统计失败:`, error)
        continue
      }
      
      const folderFileCount = files?.length || 0
      const folderSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0
      
      folderStats[folderName] = {
        files: folderFileCount,
        size: folderSize
      }
      
      totalFiles += folderFileCount
      totalSize += folderSize
    }
    
    return {
      success: true,
      data: {
        totalFiles,
        totalSize,
        folderStats
      }
    }
  } catch (error) {
    console.error('获取存储统计时发生错误:', error)
    return {
      success: false,
      error: '获取存储统计时发生错误'
    }
  }
}
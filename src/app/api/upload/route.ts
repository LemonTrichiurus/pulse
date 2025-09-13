import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, createErrorResponse, createSuccessResponse, createAuditLog } from '@/lib/security'
import { uploadFile, deleteFile, listFiles, STORAGE_CONFIG } from '@/lib/storage'
import { uploadFileSchema, validateRequest } from '@/lib/validations'

// 获取文件类型分类
function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document'
  return null
}

// POST /api/upload - 上传文件
export async function POST(request: NextRequest) {
  try {
    // 获取用户信息
    const { user, error: authError } = await getUserFromRequest(request)
    
    if (authError || !user) {
      return createErrorResponse('需要登录', 401)
    }
    
    // 获取表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'documents'
    const customFileName = formData.get('fileName') as string
    
    if (!file) {
      return createErrorResponse('请选择要上传的文件', 400)
    }
    
    // 验证文件
    const validation = validateRequest(uploadFileSchema, { file })
    if (!validation.success) {
      return createErrorResponse(validation.error!, 400)
    }
    
    // 验证文件夹路径
    const allowedFolders = Object.values(STORAGE_CONFIG.FOLDERS)
    if (!allowedFolders.includes(folder)) {
      return createErrorResponse('无效的文件夹路径', 400)
    }
    
    // 上传文件
    const uploadResult = await uploadFile(file, folder, user.id, customFileName)
    
    if (!uploadResult.success) {
      return createErrorResponse(uploadResult.error!, 500)
    }
    
    // 记录审计日志
    await createAuditLog({
      actorId: user.id,
      action: 'UPLOAD_FILE',
      entity: 'file',
      meta: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder,
        path: uploadResult.data!.path
      }
    })
    
    return createSuccessResponse({
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        path: uploadResult.data!.path,
        url: uploadResult.data!.publicUrl
      }
    }, '文件上传成功')
    
  } catch (error) {
    console.error('文件上传失败:', error)
    return createErrorResponse('文件上传失败', 500)
  }
}

// GET /api/upload - 获取用户上传的文件列表
export async function GET(request: NextRequest) {
  try {
    // 获取用户信息
    const { user, error: authError } = await getUserFromRequest(request)
    
    if (authError || !user) {
      return createErrorResponse('需要登录', 401)
    }
    
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'documents'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    // 验证文件夹路径
    const allowedFolders = Object.values(STORAGE_CONFIG.FOLDERS)
    if (!allowedFolders.includes(folder)) {
      return createErrorResponse('无效的文件夹路径', 400)
    }
    
    // 构建用户特定的文件夹路径
    const userFolder = `${folder}/${user.id}`
    
    // 获取文件列表
    const result = await listFiles(userFolder, {
      limit,
      offset: (page - 1) * limit,
      search
    })
    
    if (!result.success) {
      return createErrorResponse(result.error!, 500)
    }
    
    return createSuccessResponse({
      files: result.data || [],
      pagination: {
        page,
        limit,
        total: result.data?.length || 0,
        totalPages: Math.ceil((result.data?.length || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('获取文件列表失败:', error)
    return createErrorResponse('获取文件列表失败', 500)
  }
}

// DELETE /api/upload - 删除文件
export async function DELETE(request: NextRequest) {
  try {
    // 获取用户信息
    const { user, error: authError } = await getUserFromRequest(request)
    
    if (authError || !user) {
      return createErrorResponse('需要登录', 401)
    }
    
    const { filePath } = await request.json()
    
    if (!filePath) {
      return createErrorResponse('请提供文件路径', 400)
    }
    
    // 验证用户只能删除自己的文件
    if (!filePath.includes(`/${user.id}/`)) {
      return createErrorResponse('无权删除此文件', 403)
    }
    
    // 删除文件
    const result = await deleteFile(filePath)
    
    if (!result.success) {
      return createErrorResponse(result.error!, 500)
    }
    
    // 记录审计日志
    await createAuditLog({
      actorId: user.id,
      action: 'DELETE_FILE',
      entity: 'file',
      meta: {
        filePath
      }
    })
    
    return createSuccessResponse(null, '文件删除成功')
    
  } catch (error) {
    console.error('删除文件失败:', error)
    return createErrorResponse('删除文件失败', 500)
  }
}
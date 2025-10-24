'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Heart, Share2, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

// 定义数据类型
interface ShareDetail {
  id: string
  title: string
  content_rich: string
  media_url: string | null
  media_urls: string[] | null
  author_id: string
  published_at: string | null
  status: 'DRAFT' | 'PUBLISHED'
  created_at: string
  updated_at: string
  author?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export default function ShareDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [share, setShare] = useState<ShareDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [imgAspect, setImgAspect] = useState<number | null>(null)
  const [tileAspects, setTileAspects] = useState<Record<number, number>>({})
  
  // 格式化日期函数
  const formatDate = (dateString: string, prefix: string = '') => {
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return prefix + formatted
  }
  
  // 获取文章详情
  useEffect(() => {
    const fetchShare = async () => {
      if (!params.id) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/sharespeare/${params.id}`)
        if (!response.ok) {
          throw new Error('文章不存在')
        }
        const data: ShareDetail = await response.json()
        setShare(data)
        setIsLiked(false) // 暂时设为false，后续可以根据用户状态设置
        setLikeCount(0) // 暂时设为0，后续可以从数据库获取
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchShare()
  }, [params.id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    toast.success(isLiked ? '取消点赞' : '点赞成功')
  }

  const handleShare = async () => {
    if (!share) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: share.title,
          text: share.title,
          url: window.location.href,
        })
        toast.success('分享成功')
      } catch (error) {
        console.log('分享取消')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制到剪贴板')
    }
  }



  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-8 max-w-[1400px]">
          <div className="mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !share) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-8 max-w-[1400px]">
          <div className="mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || '文章不存在'}
            </h1>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-8 max-w-[1400px]">
        <div className="mx-auto">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Button onClick={() => router.back()} variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
          </div>

          {/* 文章内容 */}
          <Card className="mb-8">
            <CardContent className="p-8">
              {/* 文章标题 */}
              <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{share.title}</h1>
              
              {/* 作者信息 */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={share.author?.avatar_url || undefined} alt={share.author?.display_name || '匿名用户'} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <GraduationCap className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{share.author?.display_name || '匿名用户'}</h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      作者
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {share.published_at && formatDate(share.published_at, '发表于 ')}
                      {!share.published_at && share.updated_at !== share.created_at && formatDate(share.updated_at, '修改于 ')}
                      {!share.published_at && share.updated_at === share.created_at && formatDate(share.created_at, '创作于 ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 文章正文 */}
              <div 
                className="prose prose-gray dark:prose-invert max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: share.content_rich }}
              />

              {/* 媒体内容 */}
              {(share.media_url || (share.media_urls && share.media_urls.length > 0)) && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {/* 单张图片显示 */}
                  {share.media_url && !share.media_urls && (
                    <div className="mb-4">
                      <div className="w-full" style={{ aspectRatio: imgAspect ? `${imgAspect}` : '16/9' }}>
                        <img
                          src={share.media_url}
                          alt="文章配图"
                          className="w-full h-full object-contain mx-auto rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105"
                          onLoad={(e) => {
                            const img = e.currentTarget
                            const aspect = img.naturalWidth / img.naturalHeight
                            setImgAspect(aspect)
                          }}
                          onClick={() => {
                            // 创建模态框显示大图
                            const modal = document.createElement('div')
                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
                            modal.onclick = () => modal.remove()
                            
                            const img = document.createElement('img')
                            img.src = share.media_url!
                            img.className = 'max-w-full max-h-full object-contain rounded-lg'
                            img.onclick = (e) => e.stopPropagation()
                            
                            modal.appendChild(img)
                            document.body.appendChild(modal)
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* 多张图片显示 */}
                  {share.media_urls && share.media_urls.length > 0 && (
                    <div className="mb-4">
                      <div className={`grid gap-4 ${
                        share.media_urls.length === 1 ? 'grid-cols-1' :
                        share.media_urls.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {share.media_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full" style={{ aspectRatio: tileAspects[index] ? `${tileAspects[index]}` : (share.media_urls!.length === 1 ? '16/9' : share.media_urls!.length === 2 ? '4/3' : '1/1') }}>
                              <img
                                src={url}
                                alt={`文章配图 ${index + 1}`}
                                className="w-full h-full object-contain rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105"
                                onLoad={(e) => {
                                  const img = e.currentTarget
                                  const aspect = img.naturalWidth / img.naturalHeight
                                  setTileAspects(prev => ({ ...prev, [index]: aspect }))
                                }}
                                onClick={() => {
                                  // 创建模态框显示大图
                                  const modal = document.createElement('div')
                                  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
                                  modal.onclick = () => modal.remove()
                                  
                                  const img = document.createElement('img')
                                  img.src = url
                                  img.className = 'max-w-full max-h-full object-contain rounded-lg'
                                  img.onclick = (e) => e.stopPropagation()
                                  
                                  modal.appendChild(img)
                                  document.body.appendChild(modal)
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={handleLike}
                    className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {likeCount}
                  </Button>
                  <Button variant="ghost" onClick={handleShare} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    分享
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
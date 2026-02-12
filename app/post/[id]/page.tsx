"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import PostDetail from "../../components/PostDetail";
import { FEED_MODES } from "../../constants/feed";
import { fetchPostDetailWithMeta } from "../../services/posts";
import { Post, Comment, FeedMode } from "../../types";

/**
 * 게시물 상세 페이지 컴포넌트
 * 커뮤니티 게시물의 전체 내용과 댓글을 표시
 */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentMode] = useState<FeedMode>(FEED_MODES.USER);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchPostDetailWithMeta(postId);

        if (isMounted) {
          setPost(result.post);
          setComments([]);
          setIsLiked(result.isLiked);
        }
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "UNKNOWN";
        if (message === "NOT_FOUND") {
          setErrorMessage("게시물을 찾을 수 없습니다.");
        } else {
          setErrorMessage("게시물을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (post) {
      setPost({
        ...post,
        likeCount: (post.likeCount || 0) + (isLiked ? -1 : 1),
      });
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onMenuClick={() => {}}
          currentMode={currentMode}
          onModeChange={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">게시물을 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onMenuClick={() => {}}
          currentMode={currentMode}
          onModeChange={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">
            {errorMessage || "게시물을 찾을 수 없습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PostDetail
      post={post}
      comments={comments}
      isLiked={isLiked}
      isBookmarked={isBookmarked}
      currentMode={currentMode}
      onBack={() => router.back()}
      onLike={handleLike}
      onBookmark={handleBookmark}
      onShare={handleShare}
    />
  );
}

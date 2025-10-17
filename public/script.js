class SimpleComments {
    constructor() {
        this.pageId = this.getUrlParam('id');
        this.width = parseInt(this.getUrlParam('w')) || 600;
        this.height = parseInt(this.getUrlParam('h')) || 800;
        this.maxPerPage = parseInt(this.getUrlParam('max')) || 10;
        this.currentPage = 1;
        this.totalComments = 0;
        this.totalPages = 0;
        this.userIp = '';
        this.liked = false;
        
        if (!this.pageId) {
            this.showError('페이지 ID가 필요합니다. URL에 ?id=your-page-id를 추가해주세요.');
            return;
        }
        
        this.init();
    }
    
    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    async init() {
        try {
            // IP 주소 가져오기
            await this.getUserIp();
            
            // 좋아요 상태 로드
            await this.loadLikes();
            
            // 댓글 로드
            await this.loadComments();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
        } catch (error) {
            console.error('초기화 오류:', error);
            this.showError('초기화 중 오류가 발생했습니다.');
        }
    }
    
    async getUserIp() {
        try {
            const response = await fetch('/api/ip');
            const data = await response.json();
            this.userIp = data.ip;
            document.getElementById('currentIp').value = this.userIp;
        } catch (error) {
            console.error('IP 가져오기 오류:', error);
            this.userIp = 'unknown';
            document.getElementById('currentIp').value = 'IP를 가져올 수 없습니다';
        }
    }
    
    async loadLikes() {
        try {
            const response = await fetch(`/api/likes?id=${this.pageId}&ip=${this.userIp}`);
            const data = await response.json();
            
            if (data.success) {
                this.liked = data.liked;
                document.getElementById('likeCount').textContent = data.total;
                
                const likeButton = document.getElementById('likeButton');
                if (this.liked) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
            }
        } catch (error) {
            console.error('좋아요 로드 오류:', error);
        }
    }
    
    async toggleLike() {
        try {
            const response = await fetch('/api/likes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: this.pageId,
                    ip: this.userIp
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.liked = data.liked;
                document.getElementById('likeCount').textContent = data.total;
                
                const likeButton = document.getElementById('likeButton');
                if (this.liked) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
            }
        } catch (error) {
            console.error('좋아요 토글 오류:', error);
            this.showError('좋아요 처리 중 오류가 발생했습니다.');
        }
    }
    
    async loadComments(page = 1) {
        try {
            this.currentPage = page;
            const response = await fetch(`/api/comments?id=${this.pageId}&page=${page}&max=${this.maxPerPage}`);
            const data = await response.json();
            
            if (data.success) {
                this.totalComments = data.total;
                this.totalPages = Math.ceil(data.total / this.maxPerPage);
                
                this.renderComments(data.comments);
                this.renderPagination();
                this.updateCommentsHeader();
            }
        } catch (error) {
            console.error('댓글 로드 오류:', error);
            this.showError('댓글을 불러오는 중 오류가 발생했습니다.');
        }
    }
    
    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="loading">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-card">
                <div class="comment-header">
                    <span class="comment-nickname">${this.escapeHtml(comment.nickname)}</span>
                    <span class="comment-time">${this.formatTime(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                <div class="comment-actions">
                    <button class="delete-button ${comment.ip === this.userIp ? '' : 'hidden'}" 
                            onclick="app.deleteComment('${comment.commentId}')">
                        삭제
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        
        let paginationHtml = '';
        
        // 이전 페이지 버튼
        paginationHtml += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="app.loadComments(${this.currentPage - 1})">
                이전
            </button>
        `;
        
        // 페이지 번호들
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="${i === this.currentPage ? 'active' : ''}" 
                        onclick="app.loadComments(${i})">
                    ${i}
                </button>
            `;
        }
        
        // 다음 페이지 버튼
        paginationHtml += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="app.loadComments(${this.currentPage + 1})">
                다음
            </button>
        `;
        
        pagination.innerHTML = paginationHtml;
    }
    
    updateCommentsHeader() {
        document.getElementById('totalComments').textContent = this.totalComments;
    }
    
    async submitComment() {
        const nickname = document.getElementById('nickname').value.trim();
        const password = document.getElementById('password').value.trim();
        const content = document.getElementById('content').value.trim();
        
        // 유효성 검사
        if (!nickname) {
            this.showError('닉네임을 입력해주세요.');
            return;
        }
        
        if (!password || password.length !== 4) {
            this.showError('비밀번호는 4자리로 입력해주세요.');
            return;
        }
        
        if (!content) {
            this.showError('댓글 내용을 입력해주세요.');
            return;
        }
        
        if (content.length > 500) {
            this.showError('댓글은 500자 이하로 입력해주세요.');
            return;
        }
        
        const submitButton = document.getElementById('submitButton');
        submitButton.disabled = true;
        submitButton.textContent = '등록 중...';
        
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: this.pageId,
                    nickname: nickname,
                    password: password,
                    content: content,
                    ip: this.userIp
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('댓글이 등록되었습니다.');
                
                // 폼 초기화
                document.getElementById('nickname').value = '';
                document.getElementById('password').value = '';
                document.getElementById('content').value = '';
                
                // 댓글 리스트 새로고침
                await this.loadComments(this.currentPage);
            } else {
                this.showError(data.message || '댓글 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 등록 오류:', error);
            this.showError('댓글 등록 중 오류가 발생했습니다.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '댓글 등록';
        }
    }
    
    async deleteComment(commentId) {
        const password = prompt('댓글을 삭제하려면 비밀번호를 입력하세요:');
        if (!password) return;
        
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password,
                    ip: this.userIp
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('댓글이 삭제되었습니다.');
                await this.loadComments(this.currentPage);
            } else {
                this.showError(data.message || '댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            this.showError('댓글 삭제 중 오류가 발생했습니다.');
        }
    }
    
    setupEventListeners() {
        // 좋아요 버튼
        document.getElementById('likeButton').addEventListener('click', () => {
            this.toggleLike();
        });
        
        // 댓글 등록 버튼
        document.getElementById('submitButton').addEventListener('click', () => {
            this.submitComment();
        });
        
        // Enter 키로 댓글 등록
        document.getElementById('content').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.submitComment();
            }
        });
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        container.innerHTML = `<div class="${type}-message">${message}</div>`;
        
        // 3초 후 메시지 제거
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}일 전`;
        } else if (hours > 0) {
            return `${hours}시간 전`;
        } else if (minutes > 0) {
            return `${minutes}분 전`;
        } else {
            return '방금 전';
        }
    }
}

// 앱 초기화
const app = new SimpleComments();

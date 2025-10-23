class SimpleComments {
    constructor() {
        this.pageId = this.getUrlParam('id');
        this.maxPerPage = parseInt(this.getUrlParam('max')) || 10;
        this.currentPage = 1;
        this.totalComments = 0;
        this.totalPages = 0;
        this.userIp = '';
        this.liked = false;
        
        if (!this.pageId) {
            const commentsList = document.getElementById('sc-commentsList');
            commentsList.innerHTML = '<div class="sc-error-text">페이지 ID가 필요합니다</div>';
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
            await this.getUserIp();
            await this.loadLikes();
            await this.loadComments();
            this.setupEventListeners();
            
        } catch (error) {
            console.error('초기화 오류:', error);
            const commentsList = document.getElementById('sc-commentsList');
            commentsList.innerHTML = '<div class="sc-error-text">초기화에 실패했습니다</div>';
        }
    }
    
    async getUserIp() {
        try {
            const response = await fetch('/api/ip');
            const data = await response.json();
            this.userIp = data.ip;
        } catch (error) {
            console.error('IP 가져오기 오류:', error);
            this.userIp = 'unknown';
        }
    }
    
    async loadLikes() {
        try {
            const response = await fetch(`/api/likes?id=${this.pageId}&ip=${this.userIp}`);
            const data = await response.json();
            
            if (data.success) {
                this.liked = data.liked;
                document.getElementById('sc-likeCount').textContent = data.total;
                
                const likeButton = document.getElementById('sc-likeButton');
                if (this.liked) {
                    likeButton.classList.add('sc-liked');
                } else {
                    likeButton.classList.remove('sc-liked');
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
                document.getElementById('sc-likeCount').textContent = data.total;
                
                const likeButton = document.getElementById('sc-likeButton');
                if (this.liked) {
                    likeButton.classList.add('sc-liked');
                } else {
                    likeButton.classList.remove('sc-liked');
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
            const commentsList = document.getElementById('sc-commentsList');
            commentsList.innerHTML = '<div class="sc-error-text">댓글 로딩에 실패했습니다</div>';
        }
    }
    
    renderComments(comments) {
        const commentsList = document.getElementById('sc-commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="sc-loading">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="sc-comment-card" id="comment-${comment.commentId}">
                <div class="sc-comment-header">
                    <span class="sc-comment-nickname">${this.escapeHtml(comment.nickname)} (${this.escapeHtml(comment.ip)})</span>
                    <div class="sc-comment-meta">
                        <span class="sc-comment-time">${this.formatTime(comment.createdAt)}</span>
                        <button class="sc-delete-button ${comment.ip === this.userIp ? '' : 'sc-hidden'}" 
                                onclick="app.showDeleteForm('${comment.commentId}')"
                                title="삭제">×</button>
                    </div>
                </div>
                <div class="sc-comment-content">${this.escapeHtml(comment.content)}</div>
                <div class="sc-delete-form" id="delete-form-${comment.commentId}" style="display: none;">
                    <input type="password" 
                           class="sc-delete-password" 
                           id="delete-password-${comment.commentId}"
                           placeholder="비밀번호 (4자리)" 
                           maxlength="4">
                    <button class="sc-delete-confirm" onclick="app.confirmDelete('${comment.commentId}')">확인</button>
                    <button class="sc-delete-cancel" onclick="app.cancelDelete('${comment.commentId}')">취소</button>
                </div>
            </div>
        `).join('');
    }
    
    renderPagination() {
        const pagination = document.getElementById('sc-pagination');
        
        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        
        let paginationHtml = '';
        
        paginationHtml += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="app.loadComments(${this.currentPage - 1})">
                이전
            </button>
        `;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="${i === this.currentPage ? 'sc-active' : ''}" 
                        onclick="app.loadComments(${i})">
                    ${i}
                </button>
            `;
        }
        
        paginationHtml += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="app.loadComments(${this.currentPage + 1})">
                다음
            </button>
        `;
        
        pagination.innerHTML = paginationHtml;
    }
    
    updateCommentsHeader() {
        document.getElementById('sc-totalComments').textContent = this.totalComments;
    }
    
    async submitComment() {
        const nickname = document.getElementById('sc-nickname').value.trim();
        const password = document.getElementById('sc-password').value.trim();
        const content = document.getElementById('sc-content').value.trim();
        
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
        
        const submitButton = document.getElementById('sc-submitButton');
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
                    content: content
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('댓글이 등록되었습니다.');
                
                document.getElementById('sc-nickname').value = '';
                document.getElementById('sc-password').value = '';
                document.getElementById('sc-content').value = '';
                
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
    
    showDeleteForm(commentId) {
        document.querySelectorAll('.sc-delete-form').forEach(form => {
            form.style.display = 'none';
        });
        
        const form = document.getElementById(`delete-form-${commentId}`);
        if (form) {
            form.style.display = 'flex';
            const passwordInput = document.getElementById(`delete-password-${commentId}`);
            if (passwordInput) {
                setTimeout(() => passwordInput.focus(), 100);
            }
        }
    }
    
    cancelDelete(commentId) {
        const form = document.getElementById(`delete-form-${commentId}`);
        if (form) {
            form.style.display = 'none';
            const passwordInput = document.getElementById(`delete-password-${commentId}`);
            if (passwordInput) {
                passwordInput.value = '';
            }
        }
    }
    
    async confirmDelete(commentId) {
        const passwordInput = document.getElementById(`delete-password-${commentId}`);
        const password = passwordInput ? passwordInput.value.trim() : '';
        
        if (!password) {
            this.showError('비밀번호를 입력해주세요.');
            return;
        }
        
        if (password.length !== 4) {
            this.showError('비밀번호는 4자리입니다.');
            return;
        }
        
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password
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
        document.getElementById('sc-likeButton').addEventListener('click', () => {
            this.toggleLike();
        });
        
        document.getElementById('sc-submitButton').addEventListener('click', () => {
            this.submitComment();
        });
        
        document.getElementById('sc-content').addEventListener('keydown', (e) => {
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
        const container = document.getElementById('sc-messageContainer');
        container.innerHTML = `<div class="sc-${type}-message">${message}</div>`;
        
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

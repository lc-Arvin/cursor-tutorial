/**
 * 用户数据管理器 - Cursor AI 实践案例
 * 
 * 这个示例展示了如何使用 Cursor AI 来：
 * 1. 创建完整的 API 数据获取逻辑
 * 2. 处理异步操作和错误
 * 3. 实现数据缓存和状态管理
 * 4. 创建响应式 UI 组件
 */

class UserDataManager {
    constructor(apiUrl = 'https://jsonplaceholder.typicode.com') {
        this.apiUrl = apiUrl;
        this.users = [];
        this.posts = [];
        this.loading = false;
        this.error = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        
        // 绑定 this 上下文
        this.fetchUsers = this.fetchUsers.bind(this);
        this.fetchUserPosts = this.fetchUserPosts.bind(this);
        this.displayUsers = this.displayUsers.bind(this);
        this.displayError = this.displayError.bind(this);
        
        console.log('👤 用户数据管理器已初始化');
    }
    
    /**
     * 获取所有用户数据
     * @param {boolean} forceRefresh - 是否强制刷新缓存
     * @returns {Promise<Array>} 用户数组
     */
    async fetchUsers(forceRefresh = false) {
        const cacheKey = 'users';
        
        // 检查缓存
        if (!forceRefresh && this.isCacheValid(cacheKey)) {
            console.log('📖 使用缓存的用户数据');
            this.users = this.cache.get(cacheKey).data;
            this.displayUsers();
            return this.users;
        }
        
        this.setLoading(true);
        this.clearError();
        
        try {
            console.log('🌐 正在获取用户数据...');
            const response = await fetch(`${this.apiUrl}/users`);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status} - ${response.statusText}`);
            }
            
            const users = await response.json();
            
            // 数据验证
            if (!Array.isArray(users)) {
                throw new Error('API返回的数据格式不正确');
            }
            
            // 数据处理和增强
            this.users = users.map(user => ({
                ...user,
                fullAddress: this.formatAddress(user.address),
                displayName: user.name || user.username,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
                isOnline: Math.random() > 0.3 // 模拟在线状态
            }));
            
            // 缓存数据
            this.setCacheData(cacheKey, this.users);
            
            this.displayUsers();
            this.showMessage(`成功加载 ${this.users.length} 个用户`, 'success');
            
            console.log('✅ 用户数据获取成功:', this.users.length, '个用户');
            return this.users;
            
        } catch (error) {
            console.error('❌ 获取用户数据失败:', error);
            this.setError(error.message);
            this.displayError(error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * 获取指定用户的文章
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>} 文章数组
     */
    async fetchUserPosts(userId) {
        const cacheKey = `posts_${userId}`;
        
        // 检查缓存
        if (this.isCacheValid(cacheKey)) {
            console.log(`📖 使用缓存的用户${userId}文章数据`);
            return this.cache.get(cacheKey).data;
        }
        
        try {
            console.log(`🌐 正在获取用户${userId}的文章...`);
            const response = await fetch(`${this.apiUrl}/posts?userId=${userId}`);
            
            if (!response.ok) {
                throw new Error(`获取用户文章失败: ${response.status}`);
            }
            
            const posts = await response.json();
            
            // 增强文章数据
            const enhancedPosts = posts.map(post => ({
                ...post,
                excerpt: this.createExcerpt(post.body),
                readTime: this.calculateReadTime(post.body),
                publishedAt: this.generateRandomDate(),
                likes: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 20)
            }));
            
            // 缓存数据
            this.setCacheData(cacheKey, enhancedPosts);
            
            console.log(`✅ 用户${userId}文章获取成功:`, enhancedPosts.length, '篇文章');
            return enhancedPosts;
            
        } catch (error) {
            console.error(`❌ 获取用户${userId}文章失败:`, error);
            throw error;
        }
    }
    
    /**
     * 搜索用户
     * @param {string} query - 搜索关键词
     * @returns {Array} 匹配的用户数组
     */
    searchUsers(query) {
        if (!query || !query.trim()) {
            return this.users;
        }
        
        const searchTerm = query.toLowerCase().trim();
        const filteredUsers = this.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.company?.name?.toLowerCase().includes(searchTerm)
        );
        
        console.log(`🔍 搜索"${query}"找到${filteredUsers.length}个用户`);
        return filteredUsers;
    }
    
    /**
     * 显示用户列表
     * @param {Array} usersToShow - 要显示的用户数组，默认显示所有用户
     */
    displayUsers(usersToShow = this.users) {
        const container = document.getElementById('users-container');
        if (!container) {
            console.warn('⚠️ 未找到用户容器元素');
            return;
        }
        
        if (usersToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>没有找到用户</h3>
                    <p>请尝试其他搜索条件或刷新页面</p>
                </div>
            `;
            return;
        }
        
        const usersHTML = usersToShow.map(user => `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-header">
                    <div class="user-avatar">
                        <img src="${user.avatar}" alt="${user.displayName}" loading="lazy">
                        <div class="online-status ${user.isOnline ? 'online' : 'offline'}"></div>
                    </div>
                    <div class="user-info">
                        <h3 class="user-name">${this.escapeHtml(user.displayName)}</h3>
                        <p class="user-username">@${this.escapeHtml(user.username)}</p>
                        <p class="user-email">
                            <a href="mailto:${user.email}">${this.escapeHtml(user.email)}</a>
                        </p>
                    </div>
                </div>
                
                <div class="user-details">
                    <div class="detail-item">
                        <span class="detail-label">📱 电话:</span>
                        <span class="detail-value">${this.escapeHtml(user.phone)}</span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">🌐 网站:</span>
                        <span class="detail-value">
                            <a href="http://${user.website}" target="_blank" rel="noopener">
                                ${this.escapeHtml(user.website)}
                            </a>
                        </span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">🏢 公司:</span>
                        <span class="detail-value">${this.escapeHtml(user.company?.name || '未知')}</span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">📍 地址:</span>
                        <span class="detail-value">${this.escapeHtml(user.fullAddress)}</span>
                    </div>
                </div>
                
                <div class="user-actions">
                    <button class="btn btn-primary" onclick="userManager.showUserPosts(${user.id})">
                        📝 查看文章
                    </button>
                    <button class="btn btn-secondary" onclick="userManager.showUserDetails(${user.id})">
                        ℹ️ 详细信息
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = usersHTML;
        
        // 添加动画效果
        const cards = container.querySelectorAll('.user-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }
    
    /**
     * 显示用户文章
     * @param {number} userId - 用户ID
     */
    async showUserPosts(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showMessage('用户不存在', 'error');
            return;
        }
        
        try {
            this.showMessage('正在加载文章...', 'info');
            const posts = await this.fetchUserPosts(userId);
            
            // 创建模态框显示文章
            this.showModal(`${user.displayName} 的文章`, this.renderPosts(posts));
            
        } catch (error) {
            this.showMessage('加载文章失败', 'error');
        }
    }
    
    /**
     * 显示用户详细信息
     * @param {number} userId - 用户ID
     */
    showUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showMessage('用户不存在', 'error');
            return;
        }
        
        const detailsHTML = `
            <div class="user-details-modal">
                <div class="user-profile">
                    <img src="${user.avatar}" alt="${user.displayName}" class="profile-avatar">
                    <h2>${this.escapeHtml(user.displayName)}</h2>
                    <p class="profile-subtitle">@${this.escapeHtml(user.username)}</p>
                </div>
                
                <div class="details-grid">
                    <div class="detail-section">
                        <h3>📧 联系信息</h3>
                        <p><strong>邮箱:</strong> ${this.escapeHtml(user.email)}</p>
                        <p><strong>电话:</strong> ${this.escapeHtml(user.phone)}</p>
                        <p><strong>网站:</strong> <a href="http://${user.website}" target="_blank">${this.escapeHtml(user.website)}</a></p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>🏢 公司信息</h3>
                        <p><strong>公司名称:</strong> ${this.escapeHtml(user.company?.name || '未知')}</p>
                        <p><strong>标语:</strong> ${this.escapeHtml(user.company?.catchPhrase || '未知')}</p>
                        <p><strong>业务:</strong> ${this.escapeHtml(user.company?.bs || '未知')}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>📍 地址信息</h3>
                        <p><strong>街道:</strong> ${this.escapeHtml(user.address?.street || '未知')}</p>
                        <p><strong>套房:</strong> ${this.escapeHtml(user.address?.suite || '未知')}</p>
                        <p><strong>城市:</strong> ${this.escapeHtml(user.address?.city || '未知')}</p>
                        <p><strong>邮编:</strong> ${this.escapeHtml(user.address?.zipcode || '未知')}</p>
                        <p><strong>经纬度:</strong> ${user.address?.geo?.lat || '未知'}, ${user.address?.geo?.lng || '未知'}</p>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(`${user.displayName} - 详细信息`, detailsHTML);
    }
    
    /**
     * 渲染文章列表
     * @param {Array} posts - 文章数组
     * @returns {string} HTML字符串
     */
    renderPosts(posts) {
        if (posts.length === 0) {
            return '<div class="empty-state"><p>该用户还没有发布文章</p></div>';
        }
        
        return `
            <div class="posts-list">
                ${posts.map(post => `
                    <article class="post-item">
                        <header class="post-header">
                            <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                            <div class="post-meta">
                                <span class="post-date">${this.formatDate(post.publishedAt)}</span>
                                <span class="post-stats">
                                    👍 ${post.likes} · 💬 ${post.comments} · ⏱️ ${post.readTime}
                                </span>
                            </div>
                        </header>
                        
                        <div class="post-content">
                            <p class="post-excerpt">${this.escapeHtml(post.excerpt)}</p>
                        </div>
                        
                        <footer class="post-footer">
                            <button class="btn btn-sm btn-outline" onclick="userManager.showFullPost(${post.id})">
                                阅读全文
                            </button>
                        </footer>
                    </article>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * 显示完整文章
     * @param {number} postId - 文章ID
     */
    showFullPost(postId) {
        // 在实际应用中，这里会获取完整的文章内容
        this.showMessage('完整文章功能待实现', 'info');
    }
    
    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    displayError(message) {
        const container = document.getElementById('users-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>加载失败</h3>
                <p class="error-message">${this.escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="userManager.fetchUsers(true)">
                    🔄 重新加载
                </button>
            </div>
        `;
    }
    
    /**
     * 显示模态框
     * @param {string} title - 标题
     * @param {string} content - 内容HTML
     */
    showModal(title, content) {
        // 移除现有模态框
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>${this.escapeHtml(title)}</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 添加ESC键关闭功能
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.querySelector('.modal-overlay')?.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMessage = document.querySelector('.toast-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }
    
    // 工具方法
    
    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoading(loading) {
        this.loading = loading;
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = loading ? 'block' : 'none';
        }
    }
    
    /**
     * 设置错误状态
     * @param {string} error - 错误消息
     */
    setError(error) {
        this.error = error;
    }
    
    /**
     * 清除错误状态
     */
    clearError() {
        this.error = null;
    }
    
    /**
     * 格式化地址
     * @param {Object} address - 地址对象
     * @returns {string} 格式化后的地址
     */
    formatAddress(address) {
        if (!address) return '地址未知';
        
        const parts = [
            address.suite,
            address.street,
            address.city,
            address.zipcode
        ].filter(Boolean);
        
        return parts.join(', ') || '地址未知';
    }
    
    /**
     * 创建文章摘要
     * @param {string} body - 文章内容
     * @returns {string} 摘要
     */
    createExcerpt(body, maxLength = 120) {
        if (!body) return '';
        
        const cleaned = body.replace(/\n/g, ' ').trim();
        return cleaned.length > maxLength 
            ? cleaned.substring(0, maxLength) + '...' 
            : cleaned;
    }
    
    /**
     * 计算阅读时间
     * @param {string} content - 内容
     * @returns {string} 阅读时间
     */
    calculateReadTime(content) {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} 分钟阅读`;
    }
    
    /**
     * 生成随机日期
     * @returns {string} ISO日期字符串
     */
    generateRandomDate() {
        const start = new Date(2020, 0, 1);
        const end = new Date();
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(randomTime).toISOString();
    }
    
    /**
     * 格式化日期
     * @param {string} dateString - ISO日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    /**
     * 转义HTML字符
     * @param {string} text - 要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 检查缓存是否有效
     * @param {string} key - 缓存键
     * @returns {boolean} 缓存是否有效
     */
    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const now = Date.now();
        return (now - cached.timestamp) < this.cacheTimeout;
    }
    
    /**
     * 设置缓存数据
     * @param {string} key - 缓存键
     * @param {any} data - 要缓存的数据
     */
    setCacheData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 缓存已清空');
    }
    
    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            totalSize: JSON.stringify(Array.from(this.cache.values())).length
        };
    }
}

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDataManager;
}

// 全局实例（用于HTML页面）
if (typeof window !== 'undefined') {
    window.UserDataManager = UserDataManager;
}
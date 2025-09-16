/**
 * Todo 应用 - Cursor AI 编程助手实践案例
 * 
 * 这个应用演示了如何使用 Cursor AI 来：
 * 1. 生成完整的应用逻辑
 * 2. 优化代码结构
 * 3. 添加高级功能
 * 4. 处理边界情况
 */

class TodoApp {
    constructor() {
        // 从本地存储加载数据，如果没有则初始化为空数组
        this.todos = this.loadTodos();
        
        // 获取DOM元素
        this.input = document.querySelector('.todo-input');
        this.addBtn = document.querySelector('.add-btn');
        this.todoList = document.getElementById('todoList');
        this.stats = document.getElementById('stats');
        
        // 初始化应用
        this.init();
    }
    
    /**
     * 初始化应用，绑定事件监听器
     */
    init() {
        // 绑定添加按钮点击事件
        this.addBtn.addEventListener('click', () => this.handleAdd());
        
        // 绑定输入框回车事件
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAdd();
            }
        });
        
        // 绑定输入框实时验证
        this.input.addEventListener('input', () => {
            this.validateInput();
        });
        
        // 初始渲染
        this.render();
        
        console.log('📝 Todo应用已初始化');
    }
    
    /**
     * 处理添加新待办事项
     */
    handleAdd() {
        const text = this.input.value.trim();
        
        if (!text) {
            this.showMessage('请输入待办事项内容', 'warning');
            return;
        }
        
        if (text.length > 100) {
            this.showMessage('待办事项内容不能超过100个字符', 'error');
            return;
        }
        
        // 检查是否重复
        if (this.todos.some(todo => todo.text === text)) {
            this.showMessage('该待办事项已存在', 'warning');
            return;
        }
        
        this.addTodo(text);
        this.input.value = '';
        this.showMessage('添加成功！', 'success');
    }
    
    /**
     * 添加新的待办事项
     * @param {string} text - 待办事项文本
     */
    addTodo(text) {
        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.todos.unshift(todo); // 新项目添加到开头
        this.saveTodos();
        this.render();
        
        console.log('✅ 添加待办事项:', todo);
    }
    
    /**
     * 切换待办事项完成状态
     * @param {number} id - 待办事项ID
     */
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            
            this.saveTodos();
            this.render();
            
            const action = todo.completed ? '完成' : '取消完成';
            this.showMessage(`${action}待办事项: ${todo.text}`, 'info');
            
            console.log(`🔄 ${action}待办事项:`, todo);
        }
    }
    
    /**
     * 编辑待办事项
     * @param {number} id - 待办事项ID
     */
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const newText = prompt('编辑待办事项:', todo.text);
            
            if (newText === null) return; // 用户取消
            
            const trimmedText = newText.trim();
            if (!trimmedText) {
                this.showMessage('待办事项内容不能为空', 'error');
                return;
            }
            
            if (trimmedText.length > 100) {
                this.showMessage('待办事项内容不能超过100个字符', 'error');
                return;
            }
            
            // 检查是否与其他项目重复
            if (this.todos.some(t => t.id !== id && t.text === trimmedText)) {
                this.showMessage('该待办事项已存在', 'warning');
                return;
            }
            
            todo.text = trimmedText;
            todo.updatedAt = new Date().toISOString();
            
            this.saveTodos();
            this.render();
            
            this.showMessage('编辑成功！', 'success');
            console.log('✏️ 编辑待办事项:', todo);
        }
    }
    
    /**
     * 删除待办事项
     * @param {number} id - 待办事项ID
     */
    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && confirm(`确定要删除"${todo.text}"吗？`)) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            
            this.showMessage('删除成功！', 'success');
            console.log('🗑️ 删除待办事项:', todo);
        }
    }
    
    /**
     * 清空所有已完成的待办事项
     */
    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showMessage('没有已完成的待办事项', 'info');
            return;
        }
        
        if (confirm(`确定要清空 ${completedCount} 个已完成的待办事项吗？`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
            
            this.showMessage(`已清空 ${completedCount} 个已完成的待办事项`, 'success');
            console.log('🧹 清空已完成的待办事项');
        }
    }
    
    /**
     * 渲染待办事项列表
     */
    render() {
        if (this.todos.length === 0) {
            this.renderEmptyState();
        } else {
            this.renderTodos();
        }
        
        this.updateStats();
    }
    
    /**
     * 渲染空状态
     */
    renderEmptyState() {
        this.todoList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 4em; margin-bottom: 20px;">📝</div>
                <h3>还没有待办事项</h3>
                <p>在上方输入框中添加你的第一个待办事项吧！</p>
            </div>
        `;
    }
    
    /**
     * 渲染待办事项列表
     */
    renderTodos() {
        const todoHTML = this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" 
                       class="todo-checkbox" 
                       ${todo.completed ? 'checked' : ''} 
                       onchange="app.toggleTodo(${todo.id})">
                
                <span class="todo-text" title="创建时间: ${this.formatDate(todo.createdAt)}">
                    ${this.escapeHtml(todo.text)}
                </span>
                
                <div class="todo-actions">
                    <button class="edit-btn" onclick="app.editTodo(${todo.id})" title="编辑">
                        ✏️
                    </button>
                    <button class="delete-btn" onclick="app.deleteTodo(${todo.id})" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
        
        this.todoList.innerHTML = todoHTML;
    }
    
    /**
     * 更新统计信息
     */
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        let statsHTML = `
            <span>总计: <strong>${total}</strong> 项 | 
                  已完成: <strong>${completed}</strong> 项 | 
                  待完成: <strong>${pending}</strong> 项</span>
        `;
        
        // 如果有已完成的项目，显示清空按钮
        if (completed > 0) {
            statsHTML += `
                <button onclick="app.clearCompleted()" 
                        style="margin-left: 15px; padding: 5px 10px; background: #ff6b6b; 
                               color: white; border: none; border-radius: 5px; cursor: pointer;">
                    清空已完成 (${completed})
                </button>
            `;
        }
        
        this.stats.innerHTML = statsHTML;
    }
    
    /**
     * 验证输入
     */
    validateInput() {
        const text = this.input.value.trim();
        const btn = this.addBtn;
        
        if (text.length === 0) {
            btn.style.opacity = '0.5';
            btn.disabled = true;
        } else if (text.length > 100) {
            btn.style.opacity = '0.5';
            btn.disabled = true;
            this.input.style.borderColor = '#dc3545';
        } else {
            btn.style.opacity = '1';
            btn.disabled = false;
            this.input.style.borderColor = '#e0e0e0';
        }
    }
    
    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        // 移除现有的消息
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建新消息
        const toast = document.createElement('div');
        toast.className = `message-toast ${type}`;
        toast.textContent = message;
        
        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1000',
            animation: 'slideInRight 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // 根据类型设置背景色
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }
    
    /**
     * 生成唯一ID
     * @returns {number} 唯一ID
     */
    generateId() {
        return Date.now() + Math.random();
    }
    
    /**
     * 转义HTML字符
     * @param {string} text - 要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 格式化日期
     * @param {string} dateString - ISO日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * 保存数据到本地存储
     */
    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
            console.log('💾 数据已保存到本地存储');
        } catch (error) {
            console.error('❌ 保存数据失败:', error);
            this.showMessage('保存数据失败', 'error');
        }
    }
    
    /**
     * 从本地存储加载数据
     * @returns {Array} 待办事项数组
     */
    loadTodos() {
        try {
            const saved = localStorage.getItem('todos');
            const todos = saved ? JSON.parse(saved) : [];
            console.log('📖 从本地存储加载数据:', todos.length, '项');
            return todos;
        } catch (error) {
            console.error('❌ 加载数据失败:', error);
            this.showMessage('加载数据失败，将使用空列表', 'warning');
            return [];
        }
    }
    
    /**
     * 导出数据为JSON文件
     */
    exportData() {
        try {
            const dataStr = JSON.stringify(this.todos, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `todos_${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showMessage('数据导出成功！', 'success');
        } catch (error) {
            console.error('❌ 导出数据失败:', error);
            this.showMessage('导出数据失败', 'error');
        }
    }
    
    /**
     * 导入数据从JSON文件
     * @param {File} file - JSON文件
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.todos = data;
                    this.saveTodos();
                    this.render();
                    this.showMessage(`成功导入 ${data.length} 个待办事项！`, 'success');
                } else {
                    throw new Error('无效的数据格式');
                }
            } catch (error) {
                console.error('❌ 导入数据失败:', error);
                this.showMessage('导入数据失败：文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 初始化应用
const app = new TodoApp();

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + E 导出数据
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        app.exportData();
    }
    
    // ESC 清空输入框
    if (e.key === 'Escape') {
        app.input.value = '';
        app.input.blur();
    }
});

// 页面卸载前保存数据
window.addEventListener('beforeunload', () => {
    app.saveTodos();
});

// 开发模式下的调试功能
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 开发模式已启用');
    
    // 添加全局调试方法
    window.debugTodos = {
        getAll: () => app.todos,
        clear: () => {
            app.todos = [];
            app.saveTodos();
            app.render();
            console.log('🧹 所有待办事项已清空');
        },
        addSample: () => {
            const samples = [
                '学习 JavaScript 基础',
                '练习 Cursor AI 编程',
                '完成项目文档',
                '代码审查和优化',
                '部署测试环境'
            ];
            
            samples.forEach(text => app.addTodo(text));
            console.log('📝 已添加示例数据');
        }
    };
    
    console.log('🛠️ 调试工具已加载，使用 window.debugTodos 访问');
}
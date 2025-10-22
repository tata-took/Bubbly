// アプリケーションの状態管理
class BubblyApp {
    constructor() {
        this.bubbles = [];
        this.currentBubble = null;
        this.editMode = false;
        this.init();
    }

    init() {
        // ローカルストレージからデータを読み込み
        this.loadFromStorage();

        // イベントリスナーの設定
        this.setupEventListeners();

        // 初期表示
        this.renderChart();

        // サンプルデータがない場合は作成
        if (this.bubbles.length === 0) {
            this.createSampleData();
        }
    }

    setupEventListeners() {
        // 新規バブル作成ボタン
        document.getElementById('addBubbleBtn').addEventListener('click', () => {
            this.openModal();
        });

        // 保存ボタン
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveToStorage();
            this.showToast('データを保存しました');
        });

        // エクスポートボタン
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // インポートボタン
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // インポートファイル選択
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // カテゴリーフィルター
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // テーマ切り替え
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // モーダル関連
        this.setupModalListeners();

        // サイズスライダー
        document.getElementById('bubbleSize').addEventListener('input', (e) => {
            document.getElementById('sizeValue').textContent = e.target.value;
        });

        // カラープリセット
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.getElementById('bubbleColor').value = color;
            });
        });
    }

    setupModalListeners() {
        const modal = document.getElementById('bubbleModal');
        const detailModal = document.getElementById('detailModal');
        const form = document.getElementById('bubbleForm');

        // モーダルを閉じる
        document.querySelectorAll('.close').forEach(el => {
            el.addEventListener('click', () => {
                modal.classList.remove('active');
                detailModal.classList.remove('active');
            });
        });

        // モーダル外クリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
            if (e.target === detailModal) {
                detailModal.classList.remove('active');
            }
        });

        // キャンセルボタン
        document.getElementById('cancelBtn').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // フォーム送信
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBubble();
        });

        // 削除ボタン
        document.getElementById('deleteBtn').addEventListener('click', () => {
            if (confirm('このバブルを削除しますか？')) {
                this.deleteBubble(this.currentBubble.id);
                modal.classList.remove('active');
            }
        });

        // 詳細モーダルの編集ボタン
        document.getElementById('editBubbleBtn').addEventListener('click', () => {
            detailModal.classList.remove('active');
            this.openModal(this.currentBubble);
        });

        // 詳細モーダルを閉じる
        document.querySelectorAll('.close-detail').forEach(el => {
            el.addEventListener('click', () => {
                detailModal.classList.remove('active');
            });
        });
    }

    openModal(bubble = null) {
        const modal = document.getElementById('bubbleModal');
        const form = document.getElementById('bubbleForm');
        const deleteBtn = document.getElementById('deleteBtn');

        if (bubble) {
            // 編集モード
            this.editMode = true;
            this.currentBubble = bubble;
            document.getElementById('modalTitle').textContent = 'バブルを編集';
            document.getElementById('bubbleTitle').value = bubble.title;
            document.getElementById('bubbleCategory').value = bubble.category;
            document.getElementById('bubbleSize').value = bubble.size;
            document.getElementById('sizeValue').textContent = bubble.size;
            document.getElementById('bubbleColor').value = bubble.color;
            document.getElementById('bubbleDescription').value = bubble.description || '';
            deleteBtn.style.display = 'block';
        } else {
            // 新規作成モード
            this.editMode = false;
            this.currentBubble = null;
            document.getElementById('modalTitle').textContent = '新規バブル作成';
            form.reset();
            document.getElementById('sizeValue').textContent = '30';
            deleteBtn.style.display = 'none';
        }

        modal.classList.add('active');
    }

    saveBubble() {
        const title = document.getElementById('bubbleTitle').value;
        const category = document.getElementById('bubbleCategory').value;
        const size = parseInt(document.getElementById('bubbleSize').value);
        const color = document.getElementById('bubbleColor').value;
        const description = document.getElementById('bubbleDescription').value;

        if (this.editMode && this.currentBubble) {
            // 既存のバブルを更新
            const index = this.bubbles.findIndex(b => b.id === this.currentBubble.id);
            if (index !== -1) {
                this.bubbles[index] = {
                    ...this.bubbles[index],
                    title,
                    category,
                    size,
                    color,
                    description
                };
            }
            this.showToast('バブルを更新しました');
        } else {
            // 新規バブルを作成
            const newBubble = {
                id: Date.now(),
                title,
                category,
                size,
                color,
                description,
                x: Math.random() * 800 + 100,
                y: Math.random() * 400 + 100
            };
            this.bubbles.push(newBubble);
            this.showToast('バブルを作成しました');
        }

        this.renderChart();
        this.saveToStorage();
        document.getElementById('bubbleModal').classList.remove('active');
    }

    deleteBubble(id) {
        this.bubbles = this.bubbles.filter(b => b.id !== id);
        this.renderChart();
        this.saveToStorage();
        this.showToast('バブルを削除しました');
    }

    showBubbleDetail(bubble) {
        this.currentBubble = bubble;
        const modal = document.getElementById('detailModal');

        document.getElementById('detailTitle').textContent = bubble.title;
        document.getElementById('detailCategory').textContent = bubble.category;
        document.getElementById('detailSize').textContent = bubble.size;

        const colorSpan = document.getElementById('detailColor');
        colorSpan.style.backgroundColor = bubble.color;

        document.getElementById('detailDescription').textContent = bubble.description || '説明なし';

        modal.classList.add('active');
    }

    filterByCategory(category) {
        if (category === 'all') {
            this.renderChart();
        } else {
            this.renderChart(this.bubbles.filter(b => b.category === category));
        }
    }

    renderChart(data = null) {
        const bubblesToRender = data || this.bubbles;
        if (window.bubbleChart) {
            window.bubbleChart.render(bubblesToRender);
        }
    }

    saveToStorage() {
        localStorage.setItem('bubblyData', JSON.stringify(this.bubbles));
    }

    loadFromStorage() {
        const data = localStorage.getItem('bubblyData');
        if (data) {
            this.bubbles = JSON.parse(data);
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.bubbles, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `bubbly-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.showToast('データをエクスポートしました');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.bubbles = data;
                    this.renderChart();
                    this.saveToStorage();
                    this.showToast('データをインポートしました');
                } else {
                    this.showToast('無効なデータ形式です', 'error');
                }
            } catch (error) {
                this.showToast('データの読み込みに失敗しました', 'error');
            }
        };
        reader.readAsText(file);
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        const btn = document.getElementById('themeToggle');
        btn.textContent = isDark ? '☀️ ライトモード' : '🌙 ダークモード';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    createSampleData() {
        this.bubbles = [
            {
                id: 1,
                title: 'Python基礎',
                category: '学習',
                size: 40,
                color: '#2ecc71',
                description: 'Pythonの基本文法を習得済み',
                x: 200,
                y: 200
            },
            {
                id: 2,
                title: 'JavaScript',
                category: '学習',
                size: 50,
                color: '#f39c12',
                description: 'ES6の学習中',
                x: 400,
                y: 250
            },
            {
                id: 3,
                title: 'React入門',
                category: '学習',
                size: 35,
                color: '#e74c3c',
                description: 'これから学習予定',
                x: 600,
                y: 200
            },
            {
                id: 4,
                title: '日本株式',
                category: '投資',
                size: 60,
                color: '#3498db',
                description: 'インデックス投資',
                x: 300,
                y: 400
            },
            {
                id: 5,
                title: '米国ETF',
                category: '投資',
                size: 70,
                color: '#3498db',
                description: 'S&P500連動',
                x: 500,
                y: 380
            }
        ];
        this.saveToStorage();
        this.renderChart();
    }
}

// アプリケーション起動
let app;
document.addEventListener('DOMContentLoaded', () => {
    // テーマの復元
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️ ライトモード';
    }

    app = new BubblyApp();
});

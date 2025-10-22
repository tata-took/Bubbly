// D3.jsを使用したバブルチャートの実装
class BubbleChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = d3.select(`#${containerId}`);
        this.width = 0;
        this.height = 0;
        this.simulation = null;
        this.init();
    }

    init() {
        // コンテナのサイズを取得
        const container = document.getElementById('chart-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // SVGのサイズを設定
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        // ズーム機能の設定
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            });

        this.svg.call(zoom);

        // グループ要素の作成
        this.svg.append('g').attr('class', 'bubbles-group');

        // リサイズ対応
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        const container = document.getElementById('chart-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
    }

    render(data) {
        const group = this.svg.select('.bubbles-group');

        // データバインディング
        const bubbles = group.selectAll('.bubble')
            .data(data, d => d.id);

        // 退場処理
        bubbles.exit()
            .transition()
            .duration(300)
            .attr('r', 0)
            .remove();

        // 更新処理
        bubbles.select('circle')
            .transition()
            .duration(300)
            .attr('r', d => this.getRadius(d.size))
            .attr('fill', d => d.color);

        bubbles.select('text')
            .text(d => d.title);

        // 新規追加処理
        const bubblesEnter = bubbles.enter()
            .append('g')
            .attr('class', 'bubble')
            .attr('transform', d => `translate(${d.x || this.width / 2}, ${d.y || this.height / 2})`);

        // 円を追加
        bubblesEnter.append('circle')
            .attr('r', 0)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .transition()
            .duration(500)
            .attr('r', d => this.getRadius(d.size));

        // ラベルを追加
        bubblesEnter.append('text')
            .attr('class', 'bubble-label')
            .attr('dy', '.3em')
            .text(d => d.title)
            .style('font-size', d => `${Math.max(10, this.getRadius(d.size) / 3)}px`);

        // イベントリスナーの設定
        const allBubbles = group.selectAll('.bubble');

        // クリックイベント
        allBubbles.on('click', (event, d) => {
            event.stopPropagation();
            if (window.app) {
                window.app.showBubbleDetail(d);
            }
        });

        // ダブルクリックイベント（編集）
        allBubbles.on('dblclick', (event, d) => {
            event.stopPropagation();
            if (window.app) {
                window.app.openModal(d);
            }
        });

        // ドラッグ機能の設定
        const drag = d3.drag()
            .on('start', (event, d) => {
                d3.select(event.sourceEvent.target.parentNode)
                    .raise()
                    .style('cursor', 'grabbing');
            })
            .on('drag', (event, d) => {
                // 位置を更新
                d.x = event.x;
                d.y = event.y;

                // 境界チェック
                const radius = this.getRadius(d.size);
                d.x = Math.max(radius, Math.min(this.width - radius, d.x));
                d.y = Math.max(radius, Math.min(this.height - radius, d.y));

                // 要素の位置を更新
                d3.select(event.sourceEvent.target.parentNode)
                    .attr('transform', `translate(${d.x}, ${d.y})`);
            })
            .on('end', (event, d) => {
                d3.select(event.sourceEvent.target.parentNode)
                    .style('cursor', 'move');

                // 位置を保存
                if (window.app) {
                    window.app.saveToStorage();
                }
            });

        allBubbles.call(drag);

        // ホバーエフェクト
        allBubbles
            .on('mouseenter', function(event, d) {
                d3.select(this).select('circle')
                    .transition()
                    .duration(200)
                    .attr('r', this.getRadius(d.size) * 1.1)
                    .attr('stroke-width', 3);

                // ツールチップ表示
                this.showTooltip(event, d);
            }.bind(this))
            .on('mouseleave', function(event, d) {
                d3.select(this).select('circle')
                    .transition()
                    .duration(200)
                    .attr('r', this.getRadius(d.size))
                    .attr('stroke-width', 2);

                // ツールチップ非表示
                this.hideTooltip();
            }.bind(this));

        // 衝突検出とシミュレーション
        if (data.length > 0) {
            this.startSimulation(data);
        }
    }

    startSimulation(data) {
        // 既存のシミュレーションを停止
        if (this.simulation) {
            this.simulation.stop();
        }

        // 力学シミュレーションの設定
        this.simulation = d3.forceSimulation(data)
            .force('charge', d3.forceManyBody().strength(5))
            .force('collision', d3.forceCollide().radius(d => this.getRadius(d.size) + 5))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2).strength(0.05))
            .force('x', d3.forceX(this.width / 2).strength(0.01))
            .force('y', d3.forceY(this.height / 2).strength(0.01))
            .alphaDecay(0.02)
            .on('tick', () => {
                const group = this.svg.select('.bubbles-group');
                group.selectAll('.bubble')
                    .attr('transform', d => {
                        // 境界内に制限
                        const radius = this.getRadius(d.size);
                        d.x = Math.max(radius, Math.min(this.width - radius, d.x));
                        d.y = Math.max(radius, Math.min(this.height - radius, d.y));
                        return `translate(${d.x}, ${d.y})`;
                    });
            });
    }

    getRadius(size) {
        // サイズを半径に変換（1-100 → 20-100px）
        return Math.max(20, Math.min(100, size * 0.8 + 20));
    }

    showTooltip(event, d) {
        // 既存のツールチップを削除
        this.hideTooltip();

        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'bubble-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`)
            .html(`
                <strong>${d.title}</strong><br>
                カテゴリー: ${d.category}<br>
                サイズ: ${d.size}
            `);
    }

    hideTooltip() {
        d3.selectAll('.bubble-tooltip').remove();
    }
}

// チャートのインスタンスを作成
window.addEventListener('DOMContentLoaded', () => {
    window.bubbleChart = new BubbleChart('bubbleChart');
});

// 初期設定
window.onload = () => {
	fetchWords();
	setupSortAndFilterEvents();
	setupSearch();
};

// ソート・フィルタ状態を保持するオブジェクト
let sortState = {
	word: 'default', // 'asc' | 'default'
	mark: 'default', // 'marked' | 'unmarked' | 'default'
	learned: 'default', // 'checked' | 'unchecked' | 'default'
};

// 初期データを保持
let allWords = [];

// fetchWords: データを取得し、ソート・フィルタ適用
async function fetchWords() {
	try {
		const response = await fetch('http://localhost:8080/api/words');
		if (!response.ok) throw new Error('データの取得に失敗しました');

		allWords = await response.json(); // データを保持
		allWords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); //新しい順
		applySortAndFilter(); // 初期表示
	} catch (error) {
		console.error('エラー:', error);
	}
}

// ソート・フィルタを適用
function applySortAndFilter() {
	let filteredWords = [...allWords];

	// マークによるフィルタリング
	if (sortState.mark === 'marked') {
		filteredWords = filteredWords.filter(word => word.isMarked);
	} else if (sortState.mark === 'unmarked') {
		filteredWords = filteredWords.filter(word => !word.isMarked);
	}

	// チェックによるフィルタリング
	if (sortState.learned === 'checked') {
		filteredWords = filteredWords.filter(word => word.isLearned);
	} else if (sortState.learned === 'unchecked') {
		filteredWords = filteredWords.filter(word => !word.isLearned);
	}

	// 単語のソート
	if (sortState.word === 'asc') {
		filteredWords.sort((a, b) => a.word.localeCompare(b.word));
	} else {
		// デフォルトは新しい順
		filteredWords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	}

	// 検索結果と連携
	applySearch(filteredWords);

	// ツールチップとインジケーターを更新
	updateTooltips();
	updateSortIndicators();
}

// 検索適用
function applySearch(words = allWords) {
	const query = document.getElementById('search').value.toLowerCase();
	const filter = document.getElementById('search-filter').value;

	// フィルタ条件に基づく検索
	const filteredWords = words.filter(word => {
		if (filter === 'word') {
			return word.word.toLowerCase().includes(query);
		} else if (filter === 'meaning') {
			return word.meaning.toLowerCase().includes(query);
		} else if (filter === 'example') {
			return word.exampleSentence?.toLowerCase().includes(query);
		} else {
			// すべてを対象
			return (
				word.word.toLowerCase().includes(query) ||
				word.meaning.toLowerCase().includes(query) ||
				word.exampleSentence?.toLowerCase().includes(query)
			);
		}
	});

	// 結果がない場合のUI
	if (filteredWords.length === 0) {
		const tbody = document.querySelector('table tbody');
		tbody.innerHTML = '<tr><td colspan="4">結果が見つかりません</td></tr>';
		return;
	}

	// レンダリング
	renderWords(filteredWords);
}

// ソート・フィルターボタンにイベントリスナーを追加
function setupSortAndFilterEvents() {
	// "単語"列: アルファベット昇順とデフォルト順
	document.querySelector('th:nth-child(1)').addEventListener('click', () => {
		sortState.word = sortState.word === 'asc' ? 'default' : 'asc';
		applySortAndFilter();
	});

	// "マーク"列: マーク済み、未マーク、デフォルト順
	document.querySelector('th:nth-child(3)').addEventListener('click', () => {
		sortState.mark = sortState.mark === 'default' ? 'marked' :
			sortState.mark === 'marked' ? 'unmarked' : 'default';
		applySortAndFilter();
	});

	// "覚えた！"列: チェック済み、未チェック、デフォルト順
	document.querySelector('th:nth-child(4)').addEventListener('click', () => {
		sortState.learned = sortState.learned === 'default' ? 'checked' :
			sortState.learned === 'checked' ? 'unchecked' : 'default';
		applySortAndFilter();
	});
}

//ソートリセット
function resetFilters() {
	// ソート状態を初期化
	sortState = {
		word: 'default',
		mark: 'default',
		learned: 'default',
	};

	// 検索ボックスとフィルタをクリア
	document.getElementById('search').value = '';
	document.getElementById('search-filter').value = 'all';

	// ツールチップとインジケーターを更新
	updateTooltips();
	updateSortIndicators();

	// ソート・フィルタを再適用
	applySortAndFilter();
}

// 検索対象オプション
function setupSearch() {
	const searchInput = document.getElementById('search');
	const searchFilter = document.getElementById('search-filter');

	searchInput.addEventListener('input', () => applySortAndFilter());
	searchFilter.addEventListener('change', () => applySortAndFilter());
}

// ツールチップの更新
function updateTooltips() {
	const tooltips = {
		word: document.querySelector('th:nth-child(1)'),
		mark: document.querySelector('th:nth-child(3)'),
		learned: document.querySelector('th:nth-child(4)'),
	};

	if (sortState.word === 'default') tooltips.word.title = 'クリックでアルファベット昇順に並び替え';
	else tooltips.word.title = 'クリックでデフォルト順に戻す';

	if (sortState.mark === 'default') tooltips.mark.title = 'クリックでマーク済みを表示';
	else if (sortState.mark === 'marked') tooltips.mark.title = 'クリックで未マークを表示';
	else tooltips.mark.title = 'クリックでデフォルト順に戻す';

	if (sortState.learned === 'default') tooltips.learned.title = 'クリックでチェック済みを表示';
	else if (sortState.learned === 'checked') tooltips.learned.title = 'クリックで未チェックを表示';
	else tooltips.learned.title = 'クリックでデフォルト順に戻す';
}

// ソートインジケーターの更新
function updateSortIndicators() {
	const indicators = {
		word: document.getElementById('word-indicator'),
		mark: document.getElementById('mark-indicator'),
		learned: document.getElementById('learned-indicator'),
	};

	indicators.word.textContent = sortState.word === 'asc' ? '▲' : '';
	indicators.mark.textContent = sortState.mark === 'marked' ? '★' : sortState.mark === 'unmarked' ? '☆' : '';
	indicators.learned.textContent = sortState.learned === 'checked' ? '✔' : sortState.learned === 'unchecked' ? '×' : '';
}

function formatDate(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleString('ja-JP', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function renderWords(words) {
	const tbody = document.querySelector('table tbody');
	tbody.innerHTML = '';

	words.forEach(word => {
		// メイン行を作成
		const row = createMainRow(word);
		const detailRow = createDetailRow(word);
		row.setAttribute('data-id', word.id); // IDを追加
		detailRow.setAttribute('data-id', word.id); // IDを追加

		// メイン行クリック時に詳細行をトグル
		row.addEventListener('click', (event) => {
			// 詳細行のトグルを制御する。星やチェックマーク関連の要素は無視
			if (event.target.closest('.toggle-mark') || event.target.closest('.toggle-learned')) {
				return;
			}
			if (detailRow.style.display === 'none' || !detailRow.style.display) {
				detailRow.style.display = 'table-row'; // 詳細行を表示
			} else {
				detailRow.style.display = 'none'; // 詳細行を非表示
			}
		});

		// テーブルに行を追加
		tbody.appendChild(row);
		tbody.appendChild(detailRow);
	});
}

// メイン行を作成
function createMainRow(word) {
	const row = document.createElement('tr');
	row.innerHTML = `
        <td>${word.word}</td>
        <td>${word.meaning}</td>
		<td class="toggle-mark" data-id="${word.id}" data-checked="${word.isMarked}">
			<span class="custom-star">${word.isMarked ? '★' : '☆'}</span>
		</td>
		<td class="toggle-learned" data-id="${word.id}" data-checked="${word.isLearned}">
			<span class="custom-checkmark">${word.isLearned ? '✔' : ''}</span>
		</td>
    `;

	// 星クリックイベント
	row.querySelector('.toggle-mark').addEventListener('click', async (event) => {
		const cell = event.currentTarget;
		const isChecked = cell.dataset.checked === 'true'; // 現在の状態を取得
		const newChecked = !isChecked;

		// UIを切り替え
		const starElement = cell.querySelector('.custom-star');
		starElement.textContent = newChecked ? '★' : '☆';
		starElement.style.color = newChecked ? '#f0c419' : '#ccc'; // 黄色か灰色に変更
		cell.dataset.checked = newChecked.toString();

		// API呼び出し
		await toggleMarked(cell.dataset.id, newChecked);
	});

	// チェックマーククリックイベント
	row.querySelector('.toggle-learned').addEventListener('click', async (event) => {
		const cell = event.currentTarget;
		const isChecked = cell.dataset.checked === 'true'; // 現在の状態を取得
		const newChecked = !isChecked;

		// UIを切り替え
		const checkmarkElement = cell.querySelector('.custom-checkmark');
		checkmarkElement.textContent = newChecked ? '✔' : '';
		cell.dataset.checked = newChecked.toString();

		// API呼び出し
		await toggleLearned(cell.dataset.id, newChecked);
	});

	return row;
}

// 詳細行を作成
function createDetailRow(word) {
	const detailRow = document.createElement('tr');
	detailRow.classList.add('details');
	detailRow.style.display = 'none'; // 初期状態で非表示
	detailRow.innerHTML = `
        <td colspan="4">
           <span class="heading">例文:</span> ${word.exampleSentence || 'なし'}<br>
           <span class="heading">メモ:</span> ${word.memo || 'なし'}<br>
           <span class="heading">最終更新日:</span> ${word.updatedAt ? formatDate(word.updatedAt) : formatDate(word.createdAt)}
        </td>
    `;
	return detailRow;
}

// API呼び出し処理
async function toggleMarked(id, isChecked) {
	try {
		await fetch(`http://localhost:8080/api/words/${id}/marked`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isMarked: isChecked }),
		});

		// ローカルデータを更新
		const word = allWords.find(word => word.id === parseInt(id, 10));
		if (word) word.isMarked = isChecked;

		// ソート・フィルタを適用して再描画
		applySortAndFilter();
	} catch (error) {
		console.error('更新エラー:', error);
	}
}

async function toggleLearned(id, isChecked) {
	try {
		await fetch(`http://localhost:8080/api/words/${id}/learned`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isLearned: isChecked }),
		});

		// ローカルデータを更新
		const word = allWords.find(word => word.id === parseInt(id, 10));
		if (word) word.isLearned = isChecked;

		// ソート・フィルタを適用して再描画
		applySortAndFilter();
	} catch (error) {
		console.error('更新エラー:', error);
	}
}

let wordId = null;

document.addEventListener('contextmenu', (event) => {
	event.preventDefault();

	// 右クリックされた要素が行（tr）か確認
	const row = event.target.closest('tr');
	if (!row || row.parentElement.tagName === 'THEAD') {
		// 行以外、またはthead内の要素の場合はメニューを表示しない
		return;
	}

	// コンテキストメニュー要素を取得
	const menu = document.getElementById('context-menu');

	// スクロール量を考慮してメニュー位置を設定
	let menuX = event.pageX;
	let menuY = event.pageY;

	// ウィンドウの幅・高さとメニューの幅・高さを取得
	const menuWidth = menu.offsetWidth;
	const menuHeight = menu.offsetHeight;
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;

	// 画面右端・下端にはみ出さないよう調整
	if (menuX + menuWidth > windowWidth + window.scrollX) {
		menuX = windowWidth + window.scrollX - menuWidth - 10;
	}
	if (menuY + menuHeight > windowHeight + window.scrollY) {
		menuY = windowHeight + window.scrollY - menuHeight - 10;
	}

	menu.style.left = `${menuX}px`;
	menu.style.top = `${menuY}px`;
	menu.style.display = 'block';

	wordId = event.target.closest('tr')?.dataset?.id || null;
});

// クリックした場合にメニューを非表示
document.addEventListener('click', () => {
	const menu = document.getElementById('context-menu');
	menu.style.display = 'none';
});

// 編集ボタンの処理
function editWord() {
	if (!wordId) return;
	window.location.href = `/words/new-word?id=${wordId}`;
}

// 削除ボタンの処理
async function deleteWord() {
	if (!wordId) return;
	if (!confirm('本当に削除しますか？')) return;

	try {
		const response = await fetch(`http://localhost:8080/api/words/${wordId}`, {
			method: 'DELETE',
		});

		if (response.ok) {
			alert('削除しました！');
			location.reload(); // ページをリロードして更新
		} else {
			alert('削除に失敗しました。');
		}
	} catch (error) {
		console.error('削除エラー:', error);
		alert('エラーが発生しました。');
	}
}

// モーダルの要素を取得
const modal = document.getElementById("quiz-modal");
const openModalBtn = document.querySelector(".btn-quiz");
const closeModalBtn = document.getElementById("close-modal");
const startQuizBtn = document.getElementById("start-quiz");

// モーダルを表示
openModalBtn.addEventListener("click", () => {
	modal.classList.add('show');
});

// モーダルを閉じる
closeModalBtn.addEventListener("click", () => {
	modal.classList.remove('show');
});

// 外側をクリックしてモーダルを閉じる
window.addEventListener("click", (event) => {
	if (event.target === modal) {
		modal.classList.remove('show');
	}
});

// テスト開始ボタンの動作
startQuizBtn.addEventListener("click", () => {
	const quizType = document.getElementById("quiz-type").value;
	const quizFilter = document.getElementById("quiz-filter").value;
	const questionCount = document.getElementById("question-count").value;

	console.log(`出題形式: ${quizType}, フィルタ: ${quizFilter}, 問題数: ${questionCount}`);
	alert("テスト開始！（この部分でクイズ機能を実装）");

	// モーダルを閉じる
	modal.classList.remove('show');
});

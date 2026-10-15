/* Question Editor - React app (No-JSX, plain JS) */
(function () {
  'use strict';

  const { createElement: h, useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
  const api = window.qeAPI;
  const Csv = window.QECsv;

  // Electron renderer は既定でファイルドロップを「拒否」してナビゲーションしようとする。
  // window レベルで preventDefault しないと dragover/drop が DnD ターゲットまで届かない。
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
  });

  // ===== 定数 =====
  const VERSION = 1;
  const IMG_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

  // ===== ユーティリティ =====
  const uid = () => 'q_' + Math.random().toString(36).slice(2, 10);
  const isImage = (name) =>
    IMG_EXTS.includes((name.split('.').pop() || '').toLowerCase());

  const baseName = (p) => {
    if (!p) return '';
    const norm = String(p).replace(/\\/g, '/');
    return norm.split('/').pop();
  };

  const dirName = (p) => {
    const norm = String(p).replace(/\\/g, '/');
    const idx = norm.lastIndexOf('/');
    return idx >= 0 ? norm.slice(0, idx) : '';
  };

  const joinPath = (a, b) => {
    if (!a) return b;
    return a.replace(/[\\/]+$/, '') + '/' + b.replace(/^[\\/]+/, '');
  };

  // 出力時の画像ファイル名衝突回避
  function uniqueName(seen, name) {
    if (!seen.has(name)) {
      seen.add(name);
      return name;
    }
    const dot = name.lastIndexOf('.');
    const base = dot >= 0 ? name.slice(0, dot) : name;
    const ext = dot >= 0 ? name.slice(dot) : '';
    let i = 2;
    while (true) {
      const candidate = `${base}-${i}${ext}`;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        return candidate;
      }
      i++;
    }
  }

  // ===== 初期 state =====
  const emptyProject = () => ({
    version: VERSION,
    categories: [],
    questions: [],
    imageRoot: '',
  });

  // ===== 画像 DataURL キャッシュ =====
  const dataUrlCache = new Map();
  async function loadDataUrl(absPath) {
    if (!absPath) return null;
    if (dataUrlCache.has(absPath)) return dataUrlCache.get(absPath);
    const url = await api.readFileAsDataUrl(absPath);
    if (url) dataUrlCache.set(absPath, url);
    return url;
  }

  // ===== Image Tile (個別の画像表示) =====
  function ImageTile({ absPath, onRemove, onClick }) {
    const [src, setSrc] = useState(null);
    const [missing, setMissing] = useState(false);
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const url = await loadDataUrl(absPath);
        if (cancelled) return;
        if (url) setSrc(url);
        else setMissing(true);
      })();
      return () => { cancelled = true; };
    }, [absPath]);

    return h('div', {
      className: 'qe-img-tile' + (missing ? ' qe-missing' : ''),
      title: absPath,
      onClick: () => onClick && onClick(absPath, src),
    },
      src ? h('img', { src }) : h('div', { style: { width: '100%', height: '100%' } }),
      h('div', { className: 'qe-img-label' }, baseName(absPath)),
      h('button', {
        className: 'qe-img-rm',
        title: '削除',
        onClick: (e) => { e.stopPropagation(); onRemove && onRemove(absPath); },
      }, '×')
    );
  }

  // ===== Image Section (Good/Bad) =====
  function ImageSection({ kind, paths, onAdd, onRemove, onPreview }) {
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = useCallback(async (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      const imageFiles = files.filter((f) => isImage(f.name));
      // Electron 32+ では File.path が無いので webUtils.getPathForFile を使う
      const paths = imageFiles
        .map((f) => api.getPathForFile(f))
        .filter((p) => !!p);
      if (paths.length) onAdd(paths);
    }, [onAdd]);

    const handlePickClick = useCallback(async () => {
      const picked = await api.pickImages();
      if (picked && picked.length) onAdd(picked);
    }, [onAdd]);

    return h('div', { className: `qe-img-section qe-${kind}` },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
        h('span', { style: { fontSize: '11px', color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' } },
          kind === 'good' ? 'OK 例（Good_Image）' : 'NG 例（Bad_Image）'),
        h('span', { style: { fontSize: '11px', color: 'var(--fg-3)' } }, `${paths.length} 枚`)
      ),
      paths.length > 0 && h('div', { className: 'qe-img-grid' },
        paths.map((p, i) => h(ImageTile, {
          key: p + '_' + i,
          absPath: p,
          onRemove: () => onRemove(i),
          onClick: onPreview,
        }))
      ),
      h('div', {
        className: 'qe-img-drop' + (dragOver ? ' qe-drag-over' : ''),
        onDragOver: (e) => { e.preventDefault(); setDragOver(true); },
        onDragLeave: () => setDragOver(false),
        onDrop: handleDrop,
        onClick: handlePickClick,
      }, '画像をドロップ または クリックして選択')
    );
  }

  // ===== Toolbar =====
  function Toolbar(props) {
    const { projectPath, dirty, onNew, onOpenProject, onImportCsv, onSave, onExport, questionsCount } = props;
    const projectName = projectPath ? baseName(projectPath) : '（未保存）';
    return h('div', { className: 'qe-toolbar' },
      h('button', { className: 'qe-btn', onClick: onNew, title: '新規プロジェクト' }, '新規'),
      h('button', { className: 'qe-btn', onClick: onOpenProject, title: 'project.json を開く' }, '開く'),
      h('button', { className: 'qe-btn', onClick: onImportCsv, title: '既存の Visual SelfCheck 用フォルダから取り込み' }, 'CSV取込'),
      h('button', { className: 'qe-btn', onClick: onSave, disabled: !dirty && !!projectPath, title: '編集中のデータを project.json に保存（チェックリストとしての出力ではない）' }, '編集データの一時保存'),
      h('button', { className: 'qe-btn qe-btn-primary', onClick: onExport, disabled: questionsCount === 0 }, 'エクスポート'),
      h('span', { className: 'qe-spacer' }),
      h('span', { className: 'qe-project-name' },
        projectName,
        dirty && h('span', { className: 'qe-dirty-mark', title: '未保存の変更あり' }, '●')
      )
    );
  }

  // ===== Category Pane =====
  function CategoryPane(props) {
    const { categories, questions, selectedCat, onSelectCat, onAddCat, onRenameCat, onDeleteCat, onReorderCat, onMoveQuestionToCat } = props;
    const counts = useMemo(() => {
      const m = new Map();
      for (const q of questions) m.set(q.category, (m.get(q.category) || 0) + 1);
      return m;
    }, [questions]);

    const dragSrc = useRef(null);
    const [dragOverIdx, setDragOverIdx] = useState(-1);

    const handleDragStart = (idx) => (e) => {
      dragSrc.current = { type: 'cat', idx };
      e.dataTransfer.setData('application/x-qe-cat', String(idx));
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (idx) => (e) => {
      // 設問を受け取れるか、カテゴリ並び替えか
      const types = Array.from(e.dataTransfer.types || []);
      if (types.includes('application/x-qe-cat') || types.includes('application/x-qe-question')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIdx(idx);
      }
    };

    const handleDrop = (idx, catName) => (e) => {
      e.preventDefault();
      setDragOverIdx(-1);
      const qData = e.dataTransfer.getData('application/x-qe-question');
      if (qData) {
        onMoveQuestionToCat(qData, catName);
        return;
      }
      const catData = e.dataTransfer.getData('application/x-qe-cat');
      if (catData !== '') {
        const from = parseInt(catData, 10);
        if (!isNaN(from) && from !== idx) onReorderCat(from, idx);
      }
    };

    return h('div', { className: 'qe-pane' },
      h('div', { className: 'qe-pane-head' },
        h('span', null, 'カテゴリ'),
        h('span', { style: { color: 'var(--fg-3)' } }, `${categories.length}`)
      ),
      h('div', { className: 'qe-pane-body' },
        h('div', { className: 'qe-cat-list' },
          categories.map((cat, idx) => h('div', {
            key: cat + '_' + idx,
            className: 'qe-cat-item' + (cat === selectedCat ? ' qe-selected' : '') + (dragOverIdx === idx ? ' qe-drag-over' : ''),
            draggable: true,
            onDragStart: handleDragStart(idx),
            onDragOver: handleDragOver(idx),
            onDragLeave: () => setDragOverIdx(-1),
            onDrop: handleDrop(idx, cat),
            onClick: () => onSelectCat(cat),
          },
            h('span', { className: 'qe-cat-name' }, cat || '(空)'),
            h('span', { className: 'qe-cat-count' }, counts.get(cat) || 0),
            h('span', { className: 'qe-cat-actions' },
              h('button', {
                className: 'qe-btn qe-btn-icon',
                title: 'リネーム',
                onClick: (e) => { e.stopPropagation(); onRenameCat(cat); },
              }, '✎'),
              h('button', {
                className: 'qe-btn qe-btn-icon',
                title: '削除',
                onClick: (e) => { e.stopPropagation(); onDeleteCat(cat); },
              }, '×')
            )
          ))
        ),
        h('div', { className: 'qe-cat-add', onClick: onAddCat }, '+ カテゴリを追加')
      )
    );
  }

  // ===== Question List Pane =====
  function QuestionListPane(props) {
    const { questions, selectedCat, selectedId, onSelect, onAdd, onDelete, onMove, onReorderInCat } = props;

    const filtered = useMemo(
      () => questions.filter((q) => q.category === selectedCat),
      [questions, selectedCat]
    );

    const dragSrc = useRef(null);
    const [dragOverId, setDragOverId] = useState(null);

    const handleDragStart = (q) => (e) => {
      dragSrc.current = { type: 'q', uid: q.uid };
      e.dataTransfer.setData('application/x-qe-question', q.uid);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (q) => (e) => {
      if (Array.from(e.dataTransfer.types || []).includes('application/x-qe-question')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(q.uid);
      }
    };

    const handleDrop = (targetQ) => (e) => {
      e.preventDefault();
      setDragOverId(null);
      const fromUid = e.dataTransfer.getData('application/x-qe-question');
      if (fromUid && fromUid !== targetQ.uid) onReorderInCat(fromUid, targetQ.uid);
    };

    return h('div', { className: 'qe-pane' },
      h('div', { className: 'qe-pane-head' },
        h('span', null, '設問'),
        h('span', { style: { color: 'var(--fg-3)' } }, selectedCat ? `${filtered.length} / ${questions.length}` : '—')
      ),
      h('div', { className: 'qe-pane-body' },
        !selectedCat && h('div', { className: 'qe-empty' }, '左でカテゴリを選択してね'),
        selectedCat && h(Fragment, null,
          h('div', { className: 'qe-q-list' },
            filtered.map((q, idx) => h('div', {
              key: q.uid,
              className: 'qe-q-item' + (q.uid === selectedId ? ' qe-selected' : '') + (dragOverId === q.uid ? ' qe-drag-over' : ''),
              draggable: true,
              onDragStart: handleDragStart(q),
              onDragOver: handleDragOver(q),
              onDragLeave: () => setDragOverId(null),
              onDrop: handleDrop(q),
              onClick: () => onSelect(q.uid),
            },
              h('span', { className: 'qe-q-title' + (!q.title ? ' qe-warn' : '') }, q.title || '(タイトル未設定)'),
              h('span', { className: 'qe-q-actions' },
                h('button', {
                  className: 'qe-btn qe-btn-icon',
                  title: '上へ',
                  disabled: idx === 0,
                  onClick: (e) => { e.stopPropagation(); onMove(q.uid, -1); },
                }, '↑'),
                h('button', {
                  className: 'qe-btn qe-btn-icon',
                  title: '下へ',
                  disabled: idx === filtered.length - 1,
                  onClick: (e) => { e.stopPropagation(); onMove(q.uid, 1); },
                }, '↓'),
                h('button', {
                  className: 'qe-btn qe-btn-icon',
                  title: '削除',
                  onClick: (e) => { e.stopPropagation(); onDelete(q.uid); },
                }, '×')
              )
            ))
          ),
          h('div', { className: 'qe-q-add', onClick: onAdd }, '+ 設問を追加')
        )
      )
    );
  }

  // ===== Editor Pane =====
  function EditorPane({ question, categories, onChange, onPreviewImage }) {
    if (!question) {
      return h('div', { className: 'qe-pane' },
        h('div', { className: 'qe-pane-head' }, h('span', null, '編集')),
        h('div', { className: 'qe-pane-body' },
          h('div', { className: 'qe-empty' }, '中央の設問リストから項目を選択するか、新規追加してね')
        )
      );
    }

    const upd = (patch) => onChange({ ...question, ...patch });

    return h('div', { className: 'qe-pane' },
      h('div', { className: 'qe-pane-head' },
        h('span', null, '編集'),
        h('span', { style: { color: 'var(--fg-3)', fontSize: '11px' } }, question.uid)
      ),
      h('div', { className: 'qe-pane-body' },
        h('div', { className: 'qe-editor' },
          h('div', { className: 'qe-field' },
            h('label', null, 'Title *'),
            h('input', {
              className: 'qe-input',
              value: question.title,
              onChange: (e) => upd({ title: e.target.value }),
              placeholder: '設問のタイトル',
            })
          ),
          h('div', { className: 'qe-field' },
            h('label', null, 'Category *'),
            h('select', {
              className: 'qe-input',
              value: question.category,
              onChange: (e) => upd({ category: e.target.value }),
            },
              categories.map((c) => h('option', { key: c, value: c }, c))
            )
          ),
          h('div', { className: 'qe-field' },
            h('label', null, 'Description'),
            h('textarea', {
              className: 'qe-input',
              rows: 3,
              value: question.description,
              onChange: (e) => upd({ description: e.target.value }),
              placeholder: '設問の説明（複数行可）',
            })
          ),
          h('div', { className: 'qe-field' },
            h('label', null, 'Note'),
            h('textarea', {
              className: 'qe-input',
              rows: 2,
              value: question.note,
              onChange: (e) => upd({ note: e.target.value }),
              placeholder: '補足メモ',
            })
          ),
          h('div', { className: 'qe-field' },
            h(ImageSection, {
              kind: 'good',
              paths: question.goodImages,
              onAdd: (paths) => upd({ goodImages: [...question.goodImages, ...paths] }),
              onRemove: (idx) => upd({ goodImages: question.goodImages.filter((_, i) => i !== idx) }),
              onPreview: onPreviewImage,
            })
          ),
          h('div', { className: 'qe-field' },
            h(ImageSection, {
              kind: 'bad',
              paths: question.badImages,
              onAdd: (paths) => upd({ badImages: [...question.badImages, ...paths] }),
              onRemove: (idx) => upd({ badImages: question.badImages.filter((_, i) => i !== idx) }),
              onPreview: onPreviewImage,
            })
          ),
          h('div', { className: 'qe-field' },
            h('label', null, 'URL'),
            h('input', {
              className: 'qe-input',
              value: question.url,
              onChange: (e) => upd({ url: e.target.value }),
              placeholder: 'https://...',
            })
          )
        )
      )
    );
  }

  // ===== Modal helpers =====
  function PromptModal({ title, defaultValue, placeholder, onCancel, onConfirm }) {
    const [value, setValue] = useState(defaultValue || '');
    const inputRef = useRef(null);
    useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);
    const submit = () => { if (value.trim()) onConfirm(value.trim()); };
    return h('div', { className: 'qe-modal-bg', onClick: onCancel },
      h('div', { className: 'qe-modal', onClick: (e) => e.stopPropagation() },
        h('h3', null, title),
        h('input', {
          ref: inputRef,
          className: 'qe-input',
          value,
          placeholder,
          onChange: (e) => setValue(e.target.value),
          onKeyDown: (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); },
        }),
        h('div', { className: 'qe-modal-actions' },
          h('button', { className: 'qe-btn', onClick: onCancel }, 'キャンセル'),
          h('button', { className: 'qe-btn qe-btn-primary', onClick: submit }, 'OK')
        )
      )
    );
  }

  function ConfirmModal({ title, message, onCancel, onConfirm, confirmLabel }) {
    return h('div', { className: 'qe-modal-bg', onClick: onCancel },
      h('div', { className: 'qe-modal', onClick: (e) => e.stopPropagation() },
        h('h3', null, title),
        h('div', { style: { color: 'var(--fg-2)', whiteSpace: 'pre-wrap' } }, message),
        h('div', { className: 'qe-modal-actions' },
          h('button', { className: 'qe-btn', onClick: onCancel }, 'キャンセル'),
          h('button', { className: 'qe-btn qe-btn-primary', onClick: onConfirm }, confirmLabel || 'OK')
        )
      )
    );
  }

  function ImagePreviewModal({ src, onClose }) {
    return h('div', { className: 'qe-modal-bg', onClick: onClose },
      h('div', { className: 'qe-modal qe-modal-img', onClick: (e) => e.stopPropagation() },
        h('img', { src }),
        h('div', { className: 'qe-modal-actions' },
          h('button', { className: 'qe-btn qe-btn-primary', onClick: onClose }, '閉じる')
        )
      )
    );
  }

  function ExportWarnModal({ warnings, onCancel, onProceed }) {
    return h('div', { className: 'qe-modal-bg', onClick: onCancel },
      h('div', { className: 'qe-modal', onClick: (e) => e.stopPropagation() },
        h('h3', null, 'エクスポート前の確認'),
        warnings.length === 0
          ? h('div', { style: { color: 'var(--fg-2)' } }, '問題は検出されなかったよ。')
          : h(Fragment, null,
              h('div', { style: { color: 'var(--warn)', marginBottom: '8px' } },
                `${warnings.length} 件の警告:`),
              h('ul', { className: 'qe-warn-list' },
                warnings.map((w, i) => h('li', { key: i }, w))
              )
            ),
        h('div', { className: 'qe-modal-actions' },
          h('button', { className: 'qe-btn', onClick: onCancel }, 'キャンセル'),
          h('button', { className: 'qe-btn qe-btn-primary', onClick: onProceed }, 'このままエクスポート')
        )
      )
    );
  }

  function ExportDoneModal({ result, onClose }) {
    return h('div', { className: 'qe-modal-bg', onClick: onClose },
      h('div', { className: 'qe-modal', onClick: (e) => e.stopPropagation() },
        h('h3', null, 'エクスポート完了'),
        h('div', { style: { color: 'var(--fg-2)' } },
          h('div', null, `出力先: ${result.targetDir}`),
          h('div', { style: { marginTop: '6px' } }, `画像コピー: ${result.copied.length} 枚`),
          result.failed.length > 0 && h('div', { style: { color: 'var(--bad)', marginTop: '6px' } },
            `失敗: ${result.failed.length} 枚`)
        ),
        h('div', { className: 'qe-modal-actions' },
          h('button', { className: 'qe-btn', onClick: () => api.showItemInFolder(result.targetDir) }, 'フォルダを開く'),
          h('button', { className: 'qe-btn qe-btn-primary', onClick: onClose }, '閉じる')
        )
      )
    );
  }

  // ===== Main App =====
  function App() {
    const [project, setProject] = useState(emptyProject());
    const [projectPath, setProjectPath] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [selectedCat, setSelectedCat] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [modal, setModal] = useState(null); // { type, ... }

    const updateProject = useCallback((updater) => {
      setProject((p) => {
        const next = typeof updater === 'function' ? updater(p) : updater;
        return next;
      });
      setDirty(true);
    }, []);

    const selectedQuestion = useMemo(
      () => project.questions.find((q) => q.uid === selectedId) || null,
      [project.questions, selectedId]
    );

    // ---- カテゴリ操作 ----
    const addCategory = () => {
      setModal({
        type: 'prompt',
        title: '新しいカテゴリ名',
        placeholder: '例: リグ',
        onConfirm: (name) => {
          if (project.categories.includes(name)) {
            setModal({ type: 'confirm', title: '重複', message: '同名のカテゴリが既にあるよ', onConfirm: () => setModal(null), onCancel: () => setModal(null), confirmLabel: 'OK' });
            return;
          }
          updateProject((p) => ({ ...p, categories: [...p.categories, name] }));
          setSelectedCat(name);
          setModal(null);
        },
      });
    };

    const renameCategory = (oldName) => {
      setModal({
        type: 'prompt',
        title: `カテゴリ「${oldName}」をリネーム`,
        defaultValue: oldName,
        onConfirm: (newName) => {
          if (newName === oldName) { setModal(null); return; }
          if (project.categories.includes(newName)) {
            alert('同名のカテゴリが既にあるよ');
            return;
          }
          updateProject((p) => ({
            ...p,
            categories: p.categories.map((c) => (c === oldName ? newName : c)),
            questions: p.questions.map((q) => (q.category === oldName ? { ...q, category: newName } : q)),
          }));
          if (selectedCat === oldName) setSelectedCat(newName);
          setModal(null);
        },
      });
    };

    const deleteCategory = (name) => {
      const count = project.questions.filter((q) => q.category === name).length;
      setModal({
        type: 'confirm',
        title: 'カテゴリ削除',
        message: `「${name}」を削除する？\n所属する設問 ${count} 件も同時に削除されるよ。`,
        confirmLabel: '削除',
        onConfirm: () => {
          updateProject((p) => ({
            ...p,
            categories: p.categories.filter((c) => c !== name),
            questions: p.questions.filter((q) => q.category !== name),
          }));
          if (selectedCat === name) setSelectedCat(null);
          if (selectedQuestion && selectedQuestion.category === name) setSelectedId(null);
          setModal(null);
        },
        onCancel: () => setModal(null),
      });
    };

    const reorderCategory = (from, to) => {
      updateProject((p) => {
        const cats = p.categories.slice();
        const [moved] = cats.splice(from, 1);
        cats.splice(to, 0, moved);
        return { ...p, categories: cats };
      });
    };

    // ---- 設問操作 ----
    const addQuestion = () => {
      if (!selectedCat) return;
      const q = {
        uid: uid(),
        title: '',
        category: selectedCat,
        description: '',
        note: '',
        goodImages: [],
        badImages: [],
        url: '',
      };
      updateProject((p) => ({ ...p, questions: [...p.questions, q] }));
      setSelectedId(q.uid);
    };

    const updateQuestion = (next) => {
      updateProject((p) => ({
        ...p,
        questions: p.questions.map((q) => (q.uid === next.uid ? next : q)),
      }));
    };

    const deleteQuestion = (qid) => {
      updateProject((p) => ({ ...p, questions: p.questions.filter((q) => q.uid !== qid) }));
      if (selectedId === qid) setSelectedId(null);
    };

    const moveQuestion = (qid, delta) => {
      updateProject((p) => {
        // 同一カテゴリ内での前後入れ替え
        const target = p.questions.find((q) => q.uid === qid);
        if (!target) return p;
        const sameCat = p.questions
          .map((q, i) => ({ q, i }))
          .filter((x) => x.q.category === target.category);
        const localIdx = sameCat.findIndex((x) => x.q.uid === qid);
        const swapWith = sameCat[localIdx + delta];
        if (!swapWith) return p;
        const newQs = p.questions.slice();
        const tmp = newQs[sameCat[localIdx].i];
        newQs[sameCat[localIdx].i] = newQs[swapWith.i];
        newQs[swapWith.i] = tmp;
        return { ...p, questions: newQs };
      });
    };

    const reorderQuestionInCat = (fromUid, toUid) => {
      updateProject((p) => {
        const newQs = p.questions.slice();
        const fromIdx = newQs.findIndex((q) => q.uid === fromUid);
        const toIdx = newQs.findIndex((q) => q.uid === toUid);
        if (fromIdx < 0 || toIdx < 0) return p;
        if (newQs[fromIdx].category !== newQs[toIdx].category) return p;
        const [moved] = newQs.splice(fromIdx, 1);
        const newToIdx = newQs.findIndex((q) => q.uid === toUid);
        newQs.splice(newToIdx, 0, moved);
        return { ...p, questions: newQs };
      });
    };

    const moveQuestionToCat = (qid, newCat) => {
      updateProject((p) => ({
        ...p,
        questions: p.questions.map((q) => (q.uid === qid ? { ...q, category: newCat } : q)),
      }));
    };

    // ---- ファイル I/O ----
    const confirmDiscard = (then) => {
      if (!dirty) { then(); return; }
      setModal({
        type: 'confirm',
        title: '未保存の変更があるよ',
        message: '現在の編集内容は破棄されるよ。続ける？',
        confirmLabel: '破棄して続ける',
        onConfirm: () => { setModal(null); then(); },
        onCancel: () => setModal(null),
      });
    };

    const newProject = () => confirmDiscard(() => {
      setProject(emptyProject());
      setProjectPath(null);
      setDirty(false);
      setSelectedCat(null);
      setSelectedId(null);
    });

    const openProject = () => confirmDiscard(async () => {
      const result = await api.pickProjectJson();
      if (!result) return;
      if (result.error) { alert('読み込み失敗: ' + result.error); return; }
      const data = result.data;
      // 簡易マイグレーション / バリデーション
      const p = {
        version: data.version || VERSION,
        categories: Array.isArray(data.categories) ? data.categories : [],
        questions: Array.isArray(data.questions) ? data.questions.map((q) => ({
          uid: q.uid || uid(),
          title: q.title || '',
          category: q.category || '',
          description: q.description || '',
          note: q.note || '',
          goodImages: Array.isArray(q.goodImages) ? q.goodImages : [],
          badImages: Array.isArray(q.badImages) ? q.badImages : [],
          url: q.url || '',
        })) : [],
        imageRoot: data.imageRoot || '',
      };
      setProject(p);
      setProjectPath(result.filePath);
      setDirty(false);
      setSelectedCat(p.categories[0] || null);
      setSelectedId(null);
    });

    const saveProject = async () => {
      const result = await api.saveProjectJson(project, projectPath);
      if (!result) return;
      setProjectPath(result.filePath);
      setDirty(false);
    };

    const importCsv = () => confirmDiscard(async () => {
      const result = await api.importCsvFolder();
      if (!result) return;
      if (result.error) { alert(result.error); return; }
      const rows = Csv.parseCSV(result.csvText);
      const parsed = Csv.rowsToQuestions(rows);

      const cats = [];
      const seenCats = new Set();
      const questions = [];
      for (const item of parsed) {
        if (item.category && !seenCats.has(item.category)) {
          seenCats.add(item.category);
          cats.push(item.category);
        }
        questions.push({
          uid: uid(),
          title: item.title,
          category: item.category,
          description: item.description,
          note: item.note,
          // 相対パスを絶対パスに変換（folder ベース）
          goodImages: item.goodImagesRel.map((rel) => joinPath(result.folder, rel)),
          badImages: item.badImagesRel.map((rel) => joinPath(result.folder, rel)),
          url: item.url,
        });
      }
      const p = { version: VERSION, categories: cats, questions, imageRoot: result.folder };
      setProject(p);
      setProjectPath(null);
      setDirty(true);
      setSelectedCat(cats[0] || null);
      setSelectedId(null);
    });

    // ---- エクスポート ----
    const collectExportWarnings = async () => {
      const warns = [];
      // タイトル / カテゴリ未設定
      project.questions.forEach((q, i) => {
        if (!q.title) warns.push(`設問 #${i + 1}: Title 未設定（Visual SelfCheck で読み飛ばされるよ）`);
        if (!q.category) warns.push(`設問 #${i + 1} (${q.title || '無題'}): Category 未設定（同上）`);
      });
      // 参照切れ画像
      for (const q of project.questions) {
        for (const p of [...q.goodImages, ...q.badImages]) {
          const exists = await api.fileExists(p);
          if (!exists) warns.push(`画像が見つからない: ${p}（設問: ${q.title || q.uid}）`);
        }
      }
      return warns;
    };

    const doExport = async () => {
      // ターゲットフォルダを先に選ぶ
      const targetDir = await api.pickFolder('エクスポート先フォルダを選択');
      if (!targetDir) return;

      const warns = await collectExportWarnings();
      setModal({
        type: 'export-warn',
        warnings: warns,
        onCancel: () => setModal(null),
        onProceed: async () => {
          setModal(null);
          // 画像のリネーム計画 = ファイル名衝突回避
          const seenNames = new Set();
          const imageJobs = []; // [{ src, destName }]
          const pathToName = new Map(); // src → destName

          for (const q of project.questions) {
            for (const p of [...q.goodImages, ...q.badImages]) {
              if (pathToName.has(p)) continue;
              const exists = await api.fileExists(p);
              if (!exists) { pathToName.set(p, null); continue; }
              const name = uniqueName(seenNames, baseName(p));
              pathToName.set(p, name);
              imageJobs.push({ src: p, destName: name });
            }
          }

          // CSV 用 question データ作成
          const exportQs = project.questions
            .filter((q) => q.title || q.category) // check-tool 側で読み飛ばされる行を出さない（警告は既に出してる）
            .map((q) => ({
              title: q.title,
              category: q.category,
              description: q.description,
              note: q.note,
              goodImagesRel: q.goodImages.map((p) => pathToName.get(p)).filter(Boolean).map((n) => `images/${n}`),
              badImagesRel: q.badImages.map((p) => pathToName.get(p)).filter(Boolean).map((n) => `images/${n}`),
              url: q.url,
            }));

          // カテゴリ並び順を尊重するため、project.categories 順で並べ替えてから出力
          const catOrder = new Map(project.categories.map((c, i) => [c, i]));
          // 注: project.questions の元の順序を維持しつつカテゴリでグルーピング
          const byCat = new Map();
          for (const q of exportQs) {
            if (!byCat.has(q.category)) byCat.set(q.category, []);
            byCat.get(q.category).push(q);
          }
          const orderedCats = [...byCat.keys()].sort((a, b) =>
            (catOrder.get(a) ?? 999) - (catOrder.get(b) ?? 999)
          );
          const sorted = orderedCats.flatMap((c) => byCat.get(c));

          const csvText = Csv.serializeCSV(sorted);
          const result = await api.exportProject({ targetDir, csvText, images: imageJobs });
          setModal({ type: 'export-done', result, onClose: () => setModal(null) });
        },
      });
    };

    // ---- 開始時にデフォルトカテゴリ選択 ----
    useEffect(() => {
      if (!selectedCat && project.categories.length > 0) {
        setSelectedCat(project.categories[0]);
      }
    }, [project.categories, selectedCat]);

    // ---- レンダリング ----
    return h('div', { className: 'qe-app' },
      h(Toolbar, {
        projectPath,
        dirty,
        questionsCount: project.questions.length,
        onNew: newProject,
        onOpenProject: openProject,
        onImportCsv: importCsv,
        onSave: saveProject,
        onExport: doExport,
      }),
      h('div', { className: 'qe-main' },
        h(CategoryPane, {
          categories: project.categories,
          questions: project.questions,
          selectedCat,
          onSelectCat: setSelectedCat,
          onAddCat: addCategory,
          onRenameCat: renameCategory,
          onDeleteCat: deleteCategory,
          onReorderCat: reorderCategory,
          onMoveQuestionToCat: moveQuestionToCat,
        }),
        h(QuestionListPane, {
          questions: project.questions,
          selectedCat,
          selectedId,
          onSelect: setSelectedId,
          onAdd: addQuestion,
          onDelete: deleteQuestion,
          onMove: moveQuestion,
          onReorderInCat: reorderQuestionInCat,
        }),
        h(EditorPane, {
          question: selectedQuestion,
          categories: project.categories,
          onChange: updateQuestion,
          onPreviewImage: (_p, src) => src && setModal({ type: 'img-preview', src, onClose: () => setModal(null) }),
        })
      ),
      h('div', { className: 'qe-statusbar' },
        h('span', null, `カテゴリ: ${project.categories.length}`),
        h('span', null, `設問: ${project.questions.length}`),
        projectPath && h('span', { title: projectPath },
          `📁 ${baseName(projectPath)}`)
      ),
      modal && modal.type === 'prompt' && h(PromptModal, modal),
      modal && modal.type === 'confirm' && h(ConfirmModal, modal),
      modal && modal.type === 'img-preview' && h(ImagePreviewModal, modal),
      modal && modal.type === 'export-warn' && h(ExportWarnModal, modal),
      modal && modal.type === 'export-done' && h(ExportDoneModal, modal)
    );
  }

  // ===== Mount =====
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(h(App));
})();

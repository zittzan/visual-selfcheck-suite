function MctButton({
  variant,
  onClick,
  children,
  width = 132,
  height = 80
}) {
  const bg = {
    ok: 'var(--mct-good)',
    skip: 'var(--mct-neutral)',
    bad: 'var(--mct-bad)',
    loader: 'var(--mct-neutral)'
  }[variant] || 'var(--mct-neutral)';
  const hover = {
    ok: 'var(--mct-good-hover)',
    skip: 'var(--mct-neutral-2)',
    bad: 'var(--mct-bad-hover)',
    loader: 'var(--mct-neutral-2)'
  }[variant];
  const press = {
    ok: 'var(--mct-good-press)',
    skip: 'var(--mct-neutral-3)',
    bad: 'var(--mct-bad-press)',
    loader: 'var(--mct-neutral-3)'
  }[variant];
  const [state, setState] = React.useState('rest');
  const cur = state === 'press' ? press : state === 'hover' ? hover : bg;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setState('hover'),
    onMouseLeave: () => setState('rest'),
    onMouseDown: () => setState('press'),
    onMouseUp: () => setState('hover'),
    style: {
      width,
      height,
      background: cur,
      border: 'none',
      borderRadius: 0,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: '0.02em',
      lineHeight: 1,
      color: variant === 'skip' || variant === 'loader' ? 'var(--mct-ink)' : 'var(--mct-surface)',
      cursor: 'pointer',
      padding: 0,
      transition: 'background-color 120ms ease-out'
    }
  }, children);
}
function ProgressBar({
  category,
  current,
  total
}) {
  const pct = Math.round(current / total * 100);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 421,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 1,
      letterSpacing: '-0.01em',
      fontFeatureSettings: '"tnum"'
    }
  }, current, " / ", total), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 1,
      fontFeatureSettings: '"tnum"',
      color: 'var(--mct-ink-2)'
    }
  }, pct, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      height: 8,
      width: '100%',
      background: 'var(--mct-neutral)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: `${pct}%`,
      background: 'var(--mct-good)',
      transition: 'width 200ms cubic-bezier(.2,0,0,1)'
    }
  })));
}
function TitlePlate({
  id,
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      minHeight: 120,
      background: 'var(--mct-neutral)',
      padding: '20px 24px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 13,
      lineHeight: 1,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--mct-ink-2)'
    }
  }, id), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontWeight: 700,
      fontSize: 30,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: 'var(--mct-ink)'
    }
  }, title));
}
function ImagePlate({
  src,
  placeholder
}) {
  const [open, setOpen] = React.useState(false);
  const isReal = src && src !== '__placeholder__';
  React.useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: () => isReal && setOpen(true),
    style: {
      flex: 1,
      minHeight: 0,
      width: '100%',
      background: '#fff',
      position: 'relative',
      overflow: 'hidden',
      cursor: isReal ? 'zoom-in' : 'default'
    }
  }, isReal ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      fontSize: 14,
      color: '#bbb'
    }
  }, placeholder || 'image')), open && /*#__PURE__*/React.createElement("div", {
    onClick: () => setOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5vmin',
      boxSizing: 'border-box',
      cursor: 'zoom-out',
      zIndex: 9999
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: 'calc(100vw - 10vmin)',
      maxHeight: 'calc(100vh - 10vmin)',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      display: 'block',
      boxShadow: '0 20px 80px rgba(0,0,0,.6)',
      cursor: 'default'
    }
  })));
}

/* SignalColumn — fills its parent container (width/height: 100%) */
function SignalColumn({
  kind,
  images
}) {
  if (!images || images.length === 0) return null;
  const bg = kind === 'good' ? 'var(--mct-good)' : 'var(--mct-bad)';
  const label = kind === 'good' ? 'Good' : 'Bad';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: bg,
      padding: '14px 20px 16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 13,
      lineHeight: 1,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      textAlign: 'center',
      flexShrink: 0,
      color: 'var(--mct-surface)'
    }
  }, label), images.map((src, i) => /*#__PURE__*/React.createElement(ImagePlate, {
    key: i,
    src: src,
    placeholder: kind === 'good' ? 'OK' : 'Bad'
  })));
}

/* DescriptionPanel — fills its parent container (width/height: 100%) */
function DescriptionPanel({
  description,
  note,
  url
}) {
  if (!description && !note && !url) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'var(--mct-neutral)',
      padding: '20px 24px',
      boxSizing: 'border-box',
      overflow: 'auto'
    }
  }, description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap',
      color: 'var(--mct-ink)'
    }
  }, description), note && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-ink-2)'
    }
  }, note), url && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontWeight: 500,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-link)',
      textDecoration: 'underline',
      textUnderlineOffset: 3
    }
  }, url)));
}

function Loading({
  onLoad
}) {
  const [status, setStatus] = React.useState('idle'); // idle | loading | ready | error
  const [summary, setSummary] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [questions, setQuestions] = React.useState([]);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.webkitdirectory = true;
  }, []);
  async function handleFolder(e) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const csvFile = findCSVFile(fileList);
      if (!csvFile) {
        setStatus('error');
        setErrorMsg('フォルダ内に .csv ファイルが見つかりませんでした。\n設問編集ツールからエクスポートしたフォルダを選択してください。');
        return;
      }
      const text = await csvFile.text();
      const rows = parseCSV(text);
      const fileMap = buildFileMap(fileList);
      const qs = buildQuestions(rows, fileMap);
      if (qs.length === 0) {
        setStatus('error');
        setErrorMsg('設問が見つかりませんでした。CSV の形式を確認してください。\n必要な列: Title, Category, Description, Note, Good_Image, Bad_Image, URL');
        return;
      }
      const catMap = {};
      for (const q of qs) catMap[q.category] = (catMap[q.category] || 0) + 1;
      setQuestions(qs);
      setSummary({
        total: qs.length,
        categories: catMap
      });
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setErrorMsg('読み込み中にエラーが発生しました。\n' + err.message);
    }
  }
  const isReady = status === 'ready';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      background: 'var(--mct-surface)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 56,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: 'var(--mct-ink)',
      textAlign: 'center'
    }
  }, "Visual SelfCheck"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-ink-2)',
      textAlign: 'center'
    }
  }, "3D \u30E2\u30C7\u30EA\u30F3\u30B0\u306E\u30BB\u30EB\u30D5\u30C1\u30A7\u30C3\u30AF\u7528\u30C4\u30FC\u30EB", /*#__PURE__*/React.createElement("br", null), "\u8A2D\u554F\u7DE8\u96C6\u30C4\u30FC\u30EB\u304B\u3089\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3057\u305F\u30D5\u30A9\u30EB\u30C0\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044"), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    style: {
      display: 'none'
    },
    onChange: handleFolder
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 44
    }
  }, /*#__PURE__*/React.createElement(MctButton, {
    variant: "loader",
    width: 280,
    height: 80,
    onClick: () => inputRef.current && inputRef.current.click()
  }, isReady ? 'チェックリストを変更' : 'チェックリストを開く')), status === 'loading' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-ink-2)'
    }
  }, "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026"), status === 'ready' && summary && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      width: 480,
      maxHeight: 200,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--mct-good)',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--mct-surface)'
    }
  }, "\u8A2D\u554F"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 1,
      color: 'var(--mct-surface)'
    }
  }, summary.total, " \u4EF6")), Object.entries(summary.categories).map(([cat, count]) => /*#__PURE__*/React.createElement("div", {
    key: cat,
    style: {
      background: 'var(--mct-neutral)',
      padding: '8px 24px',
      marginTop: 3,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--mct-ink)'
    }
  }, cat), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      fontSize: 15,
      color: 'var(--mct-ink-2)'
    }
  }, count, " \u4EF6")))), status === 'error' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      width: 480,
      background: 'var(--mct-bad)',
      padding: '14px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--mct-surface)',
      marginBottom: 8
    }
  }, "Error"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-surface)',
      whiteSpace: 'pre-wrap'
    }
  }, errorMsg)), isReady && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(MctButton, {
    variant: "ok",
    width: 280,
    height: 72,
    onClick: () => onLoad(questions)
  }, "\u958B\u59CB")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      height: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--mct-good)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--mct-neutral)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--mct-bad)'
    }
  })));
}

function Check({
  question,
  current,
  total,
  onAnswer
}) {
  const hasGood = question.goodImages && question.goodImages.length > 0;
  const hasBad = question.badImages && question.badImages.length > 0;
  const hasDesc = !!(question.description || question.note || question.url);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: 'var(--mct-surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '33px 84px 0'
    }
  }, /*#__PURE__*/React.createElement(TitlePlate, {
    id: question.id,
    title: question.title
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      gap: 20,
      padding: '20px 84px 0',
      overflow: 'hidden'
    }
  }, hasGood && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(SignalColumn, {
    kind: "good",
    images: question.goodImages
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, hasDesc && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: hasBad ? 42 : 1,
      minHeight: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DescriptionPanel, {
    description: question.description,
    note: question.note,
    url: question.url
  })), hasBad && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: hasDesc ? 58 : 1,
      minHeight: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(SignalColumn, {
    kind: "bad",
    images: question.badImages
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      height: 103,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px'
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    category: question.category,
    current: current,
    total: total
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(MctButton, {
    variant: "ok",
    onClick: () => onAnswer('ok')
  }, "OK"), /*#__PURE__*/React.createElement(MctButton, {
    variant: "skip",
    onClick: () => onAnswer('skip')
  }, "Skip"), /*#__PURE__*/React.createElement(MctButton, {
    variant: "bad",
    onClick: () => onAnswer('bad')
  }, "BAD"))));
}

function Complete({
  results,
  onRestart
}) {
  const okCount = results.filter(r => r === 'ok').length;
  const skipCount = results.filter(r => r === 'skip').length;
  const total = results.length;
  function Tally({
    bg,
    label,
    n,
    fg
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 220,
        background: bg,
        color: fg,
        padding: '22px 26px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        opacity: 0.85
      }
    }, label), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 56,
        lineHeight: 1,
        fontFeatureSettings: '"tnum"',
        letterSpacing: '-0.02em'
      }
    }, n, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        opacity: 0.7,
        marginLeft: 4
      }
    }, " / ", total))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'var(--mct-surface)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 56,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: 'var(--mct-ink)',
      textAlign: 'center'
    }
  }, "Check Complete"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-ink-2)',
      textAlign: 'center'
    }
  }, "\u5168\u3066\u306E\u8A2D\u554F\u306E\u30C1\u30A7\u30C3\u30AF\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      width: 600,
      display: 'flex',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Tally, {
    bg: "var(--mct-good)",
    fg: "var(--mct-surface)",
    label: "OK",
    n: okCount
  }), /*#__PURE__*/React.createElement(Tally, {
    bg: "var(--mct-neutral)",
    fg: "var(--mct-ink)",
    label: "Skip",
    n: skipCount
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement(MctButton, {
    variant: "loader",
    width: 280,
    height: 72,
    onClick: onRestart
  }, "\u3082\u3046\u4E00\u5EA6")));
}

const {
  useState,
  useMemo
} = React;
function Retest({
  count,
  onContinue
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'var(--mct-surface)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      background: 'var(--mct-bad)',
      padding: '48px 0',
      textAlign: 'center',
      color: 'var(--mct-surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 13,
      lineHeight: 1,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      opacity: 0.85
    }
  }, "Retest required"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      fontWeight: 900,
      fontSize: 56,
      lineHeight: 1.1,
      letterSpacing: '-0.02em'
    }
  }, "\u518D\u30C6\u30B9\u30C8\u304C\u5FC5\u8981"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      fontWeight: 700,
      fontSize: 30,
      lineHeight: 1,
      fontFeatureSettings: '"tnum"'
    }
  }, count, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      opacity: 0.8
    }
  }, "\u554F"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 60,
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-ink-2)'
    }
  }, "BAD \u5224\u5B9A\u306E\u8A2D\u554F\u3092\u518D\u5EA6\u51FA\u984C\u3057\u307E\u3059"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(MctButton, {
    variant: "ok",
    width: 280,
    height: 72,
    onClick: onContinue
  }, "\u7D9A\u3051\u308B")));
}
function CategorySelect({
  questions,
  onStart
}) {
  const cats = useMemo(() => {
    const map = {};
    for (const q of questions) map[q.category] = (map[q.category] || 0) + 1;
    return Object.entries(map);
  }, [questions]);
  const [selected, setSelected] = useState(() => new Set(cats.map(([c]) => c)));
  function toggle(c) {
    const next = new Set(selected);
    if (next.has(c)) next.delete(c);else next.add(c);
    setSelected(next);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: 'var(--mct-surface)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 40,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: 'var(--mct-ink)',
      textAlign: 'center'
    }
  }, "\u30AB\u30C6\u30B4\u30EA\u30FC\u3092\u9078\u629E"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      fontWeight: 400,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--mct-ink-2)'
    }
  }, "\u30C1\u30A7\u30C3\u30AF\u3057\u305F\u3044\u30AB\u30C6\u30B4\u30EA\u30FC\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      width: 480,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, cats.map(([cat, count]) => {
    const on = selected.has(cat);
    return /*#__PURE__*/React.createElement("button", {
      key: cat,
      type: "button",
      onClick: () => toggle(cat),
      style: {
        width: '100%',
        height: 64,
        background: on ? 'var(--mct-good)' : 'var(--mct-neutral)',
        border: 'none',
        borderRadius: 0,
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 24,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: on ? 'var(--mct-surface)' : 'var(--mct-ink)',
        cursor: 'pointer',
        padding: 0,
        transition: 'background-color 120ms ease-out, color 120ms ease-out'
      }
    }, cat);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(MctButton, {
    variant: selected.size > 0 ? 'ok' : 'skip',
    width: 280,
    height: 72,
    onClick: () => selected.size > 0 && onStart(Array.from(selected))
  }, "\u958B\u59CB")));
}
function App() {
  const [stage, setStage] = useState('loading');
  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [queue, setQueue] = useState([]);
  const [originalLength, setOriginalLength] = useState(0);
  const [answered, setAnswered] = useState([]);
  const [pass2, setPass2] = useState([]);
  const [pass, setPass] = useState(1);
  function handleLoad(questions) {
    setLoadedQuestions(questions);
    setStage('category');
  }
  function startWithCategories(cats) {
    const set = loadedQuestions.filter(q => cats.includes(q.category));
    setQueue(set);
    setOriginalLength(set.length);
    setAnswered([]);
    setPass2([]);
    setPass(1);
    setStage('check');
  }
  function answer(verdict) {
    const [current, ...rest] = queue;
    let nextPass2 = pass2;
    let nextAnswered = answered;
    if (verdict === 'bad') {
      nextPass2 = [...pass2, current];
      setPass2(nextPass2);
    } else {
      nextAnswered = [...answered, verdict];
      setAnswered(nextAnswered);
    }
    if (rest.length === 0) {
      setStage(nextPass2.length > 0 ? 'retest' : 'complete');
    } else {
      setQueue(rest);
    }
  }
  function beginRetest() {
    setQueue(pass2);
    setOriginalLength(pass2.length);
    setPass2([]);
    setPass(p => p + 1);
    setStage('check');
  }
  const current = queue[0];
  const total = originalLength;
  const idx = total - queue.length + 1;
  return /*#__PURE__*/React.createElement("div", {
    className: "mct-stage"
  }, stage === 'loading' && /*#__PURE__*/React.createElement(Loading, {
    onLoad: handleLoad
  }), stage === 'category' && /*#__PURE__*/React.createElement(CategorySelect, {
    questions: loadedQuestions,
    onStart: startWithCategories
  }), stage === 'check' && current && /*#__PURE__*/React.createElement(Check, {
    question: current,
    current: idx,
    total: total,
    onAnswer: answer
  }), stage === 'retest' && /*#__PURE__*/React.createElement(Retest, {
    count: pass2.length,
    onContinue: beginRetest
  }), stage === 'complete' && /*#__PURE__*/React.createElement(Complete, {
    results: answered,
    onRestart: () => setStage('loading')
  }), stage === 'check' && pass > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 16,
      top: 16,
      padding: '6px 10px',
      background: 'var(--mct-bad)',
      color: 'var(--mct-surface)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: 1,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "Retest \u30FB Pass ", pass));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));

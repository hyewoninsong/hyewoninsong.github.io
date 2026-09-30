export function inviteURL(hash) {
  if (hash.length > 2048) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const entries = [...params];
  if (entries.length !== 1 || entries[0][0] !== 'from') return null;
  const name = entries[0][1];
  if (/[\p{Cc}]/u.test(name)) return null;
  const clean = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(name.trim())]
    .slice(0, 20).map(x => x.segment).join('');
  return { name: clean, url: 'supertimetable://feature/free-time-request' + (clean ? '?from=' + encodeURIComponent(clean) : '') };
}
export const copy = {
  en: ['Find a time together', 'A friend is asking for your timetable. Choose one in SuperTimetable and send the free-time file back.', 'Open SuperTimetable', 'Get the app', 'After installing, return to this invitation and tap Open SuperTimetable.', 'This invitation is invalid. Ask your friend for a new link.'],
  ko: ['함께 비는 시간 찾기', '친구가 시간표를 부탁했어. SuperTimetable에서 시간표 하나를 골라 빈 시간용 파일을 보내 줘.', 'SuperTimetable 열기', '앱 다운로드', '설치한 뒤 이 초대 페이지로 돌아와 SuperTimetable 열기를 눌러 줘.', '올바르지 않은 초대야. 친구에게 새 링크를 부탁해.'],
  ja: ['一緒に空き時間を探そう', '友達が時間割をリクエストしています。SuperTimetableで時間割を選び、空き時間用ファイルを送り返しましょう。', 'SuperTimetableを開く', 'アプリを入手', 'インストール後、この招待に戻ってSuperTimetableを開いてください。', '無効な招待です。友達に新しいリンクをお願いしてください。'],
  'zh-Hans': ['一起找空闲时间', '朋友想要你的课表。在 SuperTimetable 中选择一份课表，把空闲时间文件发回去。', '打开 SuperTimetable', '下载 App', '安装后回到此邀请页面，点击打开 SuperTimetable。', '邀请无效。请朋友发送新的链接。'],
  'zh-Hant': ['一起找空閒時間', '朋友想要你的課表。在 SuperTimetable 中選擇一份課表，把空閒時間檔案傳回去。', '開啟 SuperTimetable', '下載 App', '安裝後回到此邀請頁面，點選開啟 SuperTimetable。', '邀請無效。請朋友傳送新的連結。'],
  es: ['Encuentren un hueco libre', 'Un amigo te pide tu horario. Elige uno en SuperTimetable y envíale el archivo de tiempo libre.', 'Abrir SuperTimetable', 'Descargar la app', 'Después de instalarla, vuelve a esta invitación y toca Abrir SuperTimetable.', 'Esta invitación no es válida. Pide a tu amigo un enlace nuevo.'],
  fr: ['Trouvez un créneau ensemble', 'Un ami te demande ton emploi du temps. Choisis-en un dans SuperTimetable et renvoie le fichier de disponibilités.', 'Ouvrir SuperTimetable', 'Télécharger l’app', 'Après l’installation, reviens à cette invitation et touche Ouvrir SuperTimetable.', 'Cette invitation est invalide. Demande un nouveau lien à ton ami.'],
  'pt-BR': ['Achem um horário livre', 'Um amigo está pedindo seu horário. Escolha um no SuperTimetable e envie o arquivo de tempo livre.', 'Abrir SuperTimetable', 'Baixar o app', 'Depois de instalar, volte a este convite e toque em Abrir SuperTimetable.', 'Este convite é inválido. Peça um novo link ao seu amigo.'],
};
export function languageFor(raw) {
  if (raw.startsWith('zh')) return /Hant|TW|HK|MO/i.test(raw) ? 'zh-Hant' : 'zh-Hans';
  if (raw.startsWith('pt')) return 'pt-BR';
  return Object.hasOwn(copy, raw.split('-')[0]) ? raw.split('-')[0] : 'en';
}

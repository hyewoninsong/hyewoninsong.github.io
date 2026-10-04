# 기기 캡처에 직접 준 `border-radius` 는 앱 UI 를 자른다

**2026-09-17** · SuperTimetable 앱 페이지 iPad 탭

## 증상

아이폰 사파리로 `/ko/apps/timetable#ipad` 를 보면 iPad 스샷의 네 모서리에서
앱 UI 가 잘려 보인다. 상태바 `9:41AM` 의 `9` 가 통째로 먹히고, 왼쪽 위 툴바
캡슐(목록·자물쇠·실행취소)의 왼쪽 끝과 `08:00` 시각 축, 오른쪽 위 `…` 버튼도
곡선에 깎인다. 데스크톱(760px)에서는 거의 티가 안 나고 모바일에서만 심하다.

## 메커니즘

```css
.screenshot.ipad { border-radius: 1.25rem; }   /* 20px 고정 */
```

- iPhone 캡처(720×1564)는 **실기 화면 모서리가 둥글다.** 앱이 그 곡선을 피해
  콘텐츠를 안쪽에 배치하므로 `2.5rem` 을 줘도 잘릴 게 없다.
- iPad 4:3 캡처(1200×900, 스토어용 2048×1536 축소)는 **화면 모서리가 직각이다.**
  상태바·툴바·시각 축이 모서리에 바짝 붙어 있어, 곡률을 이미지에 직접 주면
  그 UI 가 곧바로 깎여 나간다.
- 곡률은 `rem` 고정(20px)인데 이미지는 `w-full` 로 줄어든다. 데스크톱 760px 에서
  상태바 글자는 모서리에서 약 5px 떨어져 arc 바깥이지만, 모바일 345px 에서는
  약 2.3px — 반지름 20px arc 안쪽으로 들어가 잘린다. **좁을수록 나빠진다.**

판정식: 왼쪽 위 모서리 정사각 `[0,r]×[0,r]` 안의 점은 중심 `(r,r)` 에서
거리가 `r` 을 넘으면 잘린다.

## 처방

이미지에 곡률을 주지 말고 **베젤 프레임**에 준다.

```html
<div class="shot-frame w-full max-w-[480px]"><img src="…" width="1200" height="900" /></div>
```
```css
.shot-frame {
  padding: 0.4rem;                       /* 베젤 */
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  box-shadow: 0 20px 60px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.08);
}
.shot-frame img { display:block; width:100%; height:auto; border-radius: 0.25rem; }
```

안쪽 `0.25rem`(4px)은 최악 조건(345px 렌더, 콘텐츠가 모서리에서 2.3px)에서도
`dist((2.3,2.3),(4,4)) = 2.4 < 4` 이라 안전하다. 실기 iPad 도 직각 화면이
둥근 본체 안에 들어 있으니 형태상으로도 맞다.

`.shot-row` 안에서는 플렉스 아이템이 `img` 에서 `div` 로 바뀌므로 선택자도
같이 고친다 — `.shot-row > img, .shot-row > .shot-frame { flex-shrink: 0 }`.

## 왜 못 잡았나

- iPad 탭을 추가(PR #27)할 때 데스크톱 폭에서만 확인했다. 그 폭에서는 상태바가
  arc 바깥이라 멀쩡해 보인다.
- iPhone 스샷에서 같은 패턴이 멀쩡했으므로 곡률을 그대로 물려줬다. 두 캡처의
  **실기 모서리 모양이 다르다**는 게 차이의 전부다.

## 재현 레시피

```bash
npx astro dev --port 4399
# 헤드리스 크롬은 창 폭 ~500px 아래로 안 내려가므로 iframe 으로 폭을 만든다
cat > frame.html <<'HTML'
<body style="margin:0"><iframe src="http://localhost:4399/ko/apps/timetable#ipad"
  style="width:393px;height:5200px;border:0;display:block"></iframe></body>
HTML
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --force-device-scale-factor=4 --allow-file-access-from-files \
  --window-size=500,2600 --virtual-time-budget=8000 \
  --screenshot=out.png "file://$PWD/frame.html"
# 스샷 모서리를 4배로 잘라서 상태바 글자가 온전한지 눈으로 확인
```

## 교훈

기기 캡처를 페이지에 얹을 때 곡률은 **캡처한 기기의 실제 화면 모서리**를 따른다.
직각 화면(iPad 4:3, 안드로이드 태블릿 일부)은 곡률 0 이고, 둥글게 보이고 싶으면
이미지가 아니라 프레임을 두른다. 그리고 `rem` 곡률 + `w-full` 조합은 **가장 좁은
렌더 폭**에서 검증한다 — 데스크톱은 이 종류의 결함을 숨긴다.

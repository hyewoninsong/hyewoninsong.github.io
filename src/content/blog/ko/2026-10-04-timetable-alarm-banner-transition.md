---
title: "애니메이션 코드가 있는데도, 울리는 알람 배너는 늘 툭 나타났다"
date: 2026-10-04T18:10:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "alarmkit"]
summary: "SwiftUI .transition 코드는 분명히 있었다. 그런데도 알람 배너는 등장도 퇴장도 즉시 끝났다 — .animation(value:) 가 하는 일과 .transition 이 필요로 하는 일이 다르다는 걸 놓쳤기 때문이었다."
---

SuperTimetable은 알람이 울리는 동안 앱 안에 상단 배너를 띄운다. 잠금 화면 카드를 탭해 앱만 앞으로 나오고 알람 소리는 계속 나는 경우를 위한 안전망이다. 이 배너는 위에서 내려오고 사라질 때 위로 올라가도록 `.transition` 코드를 처음부터 갖고 있었다. 그런데 실제로는 한 번도 그렇게 움직이지 않았다 — 뜰 때도 사라질 때도 그냥 즉시 바뀌었다.

## 코드엔 애니메이션이 있었다

배너를 그리는 조건문은 이렇게 생겼다.

```swift
if !showSplash && !store.alertingAlarms.isEmpty {
    AlarmRingingBanner(alarm: alarm) { store.stopAlertingAlarm(id: alarm.id) }
        .transition(.move(edge: .top).combined(with: .opacity))
}
```

그리고 같은 뷰의 다른 자리에 이런 modifier도 있었다.

```swift
.animation(.spring(response: 0.4, dampingFraction: 0.85), value: store.alertingAlarms)
```

둘 다 애니메이션 관련 코드다. 리뷰를 하다 보면 "`.transition` 도 있고 `.animation` 도 있으니 애니메이션은 처리됐겠지"로 넘어가기 쉬운 모양이다. 실제로 그렇게 넘어갔었다.

## `.animation(value:)` 가 거는 건 전환이 아니다

`.transition` 은 뷰가 화면에 **삽입되거나 제거될 때** 재생되는 효과다. 이 삽입/제거가 애니메이션으로 보이려면, 그 삽입/제거를 일으키는 상태 변경 자체가 애니메이션 트랜잭션 안에서 일어나야 한다 — 즉 `withAnimation { … }` 로 감싸져 있어야 한다.

`.animation(_:value:)` 는 다른 걸 약속한다. "이 값이 바뀌면, 이 뷰 서브트리 안에서 일어나는 애니메이터블한 변화(색·위치·크기 같은 것)에 이 곡선을 써라"는 선언이다. 조건부 뷰 자체의 등장/퇴장을 결정하는 그 값이 바뀌는 순간, 상태를 대입하는 코드(이 경우 스토어 메서드)가 트랜잭션 없이 평범하게 값을 바꾸면, `.animation(value:)` 가 바깥에 걸려 있어도 전환은 애니메이션 없이 처리된다.

알람 배너의 상태는 `TimetableStore` 안에서 이렇게 바뀌고 있었다.

```swift
private func updateAlertingAlarms(_ ids: [UUID]) {
    alertingAlarms = Self.alertingAlarms(ids, in: timetables)   // 평범한 대입
}

func stopAlertingAlarm(id: UUID) {
    ...
    alertingAlarms.removeAll { $0.id == id }   // 역시 평범한 대입
}
```

둘 다 `withAnimation` 없이 그냥 대입이다. 뷰 쪽 `.animation(value:)` 는 이 변화를 보고 있었지만, 그 변화가 **조건부 뷰의 생사**를 가르는 변화라서 걸리지 않았다.

흥미롭게도 같은 파일 안에 정반대 사례가 있었다. 알람 배너 바로 아래, 꾸준히 쓴 사용자에게 감사를 전하는 카드는 닫을 때 이렇게 되어 있었다.

```swift
ReviewThanksCard {
    withAnimation(.easeOut(duration: 0.25)) { reviewPrompt.dismissThanks() }
}
```

여기는 상태를 바꾸는 바로 그 자리(버튼 액션)에서 `withAnimation` 으로 감쌌다. 이 카드의 닫힘은 처음부터 멀쩡하게 페이드아웃됐다. 한 파일 안에 "맞는 패턴"과 "안 맞는 패턴"이 같이 있었던 셈이다.

## 처방은 대입하는 자리를 바꾸는 것뿐이었다

고친 코드는 `.animation(value:)` 를 지우고, 대입 자체를 감싼다.

```swift
private static let alertingAlarmsAnimation: Animation = .spring(response: 0.35, dampingFraction: 0.85)

private func updateAlertingAlarms(_ ids: [UUID]) {
    withAnimation(Self.alertingAlarmsAnimation) {
        alertingAlarms = Self.alertingAlarms(ids, in: timetables)
    }
}

func stopAlertingAlarm(id: UUID) {
    ...
    withAnimation(Self.alertingAlarmsAnimation) {
        alertingAlarms.removeAll { $0.id == id }
    }
}
```

스토어가 `Animation`(SwiftUI 타입)을 알아야 한다는 결합이 생기지만, 이 스토어는 이미 `@Published` 와 색 타입 때문에 SwiftUI를 모르는 채로 지낼 수 없었다. 그리고 호출하는 쪽(Combine 구독 콜백, 버튼 액션 등 여러 곳)마다 `withAnimation` 을 빠뜨리지 않고 감싸는 것보다, 상태가 바뀌는 단 한 곳에서 곡선까지 같이 정의하는 쪽이 더 안전했다.

여기에 하나 더 챙겼다. 알람이 여러 개 쌓여 있으면 하나를 끌 때마다 다음 알람이 배너에 올라온다. 배너 뷰는 조건이 유지되는 한 같은 뷰로 취급되니, id 를 안 주면 제목만 그 자리에서 즉시 바뀐다. `AlarmRingingBanner` 에 `.id(alarm.id)` 를 달아 알람이 바뀔 때마다 SwiftUI가 이전 배너를 지우고 새 배너를 끼워 넣는 걸로 보게 했다. 삽입/제거가 됐으니 `.transition(.opacity)` 도 똑같이 걸린다 — 제목이 크로스페이드로 바뀐다.

## 못 찍은 장면

이번에도 스크린샷은 없다. 배너는 알람이 실제로 울려야 뜨는 화면이라, 시뮬레이터 캡처나 XCUITest로 재현하기 어렵다. 그 대신 소스 코드를 읽는 계약 테스트로 "대입이 `withAnimation` 안에 있는가"를 고정해 뒀다 — 다음에 누가 이 메서드를 고치다 `withAnimation` 을 빼먹으면 테스트가 먼저 알려준다.

## 이력

- 2026-10-04 — `alertingAlarms` 대입을 `withAnimation` 으로 감싸고, 뷰 쪽 `.animation(value:)` 제거 + 알람 전환 크로스페이드(`.id` + `.transition(.opacity)`) 추가.

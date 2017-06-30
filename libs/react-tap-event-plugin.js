if(typeof React !== 'object' ||  !React.eventSystem){
  throw '请先加载anujs'
}

var alreadyInjected = false;
var {
  isTouch,
  eventPropHooks,
  addEvent,
  eventLowerCache,
  dispatchEvent
} = React.eventSystem;
//==============isXXX系列
function isEndish(eventType) {
  return (
    eventType === "mouseup" ||
    eventType === "touchend" ||
    eventType === "touchcancel"
  );
}

function isMoveish(eventType) {
  return eventType === "mousemove" || eventType === "touchmove";
}

function isStartish(eventType) {
  return eventType === "mousedown" || eventType === "touchstart";
}

//=============
var tapMoveThreshold = 10;
var ignoreMouseThreshold = 750;
var startCoords = { x: null, y: null };
var lastTouchTime = null;

var Axis = {
  x: { page: "pageX", client: "clientX", envScroll: "currentPageScrollLeft" },
  y: { page: "pageY", client: "clientY", envScroll: "currentPageScrollTop" }
};

// fbjs/lib/TouchEventUtils
var TouchEventUtils = {
  extractSingleTouch: function(nativeEvent) {
    var touches = nativeEvent.touches || [];
    var changedTouches = nativeEvent.changedTouches || [];

    return changedTouches[0] || touches[0] || nativeEvent;
  }
};
function getAxisCoordOfEvent(axis, nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  return singleTouch[axis.page];
}

function getDistance(coords, nativeEvent) {
  var pageX = getAxisCoordOfEvent(Axis.x, nativeEvent);
  var pageY = getAxisCoordOfEvent(Axis.y, nativeEvent);
  return Math.pow(
    Math.pow(pageX - coords.x, 2) + Math.pow(pageY - coords.y, 2),
    0.5
  );
}

function now() {
  return new Date() - 0;
}
function shouldRejectClick() {}

eventLowerCache["touchtap"] = "touchTap";
eventPropHooks.touchtap = function(event) {
  var type = event.type;
  if (!isStartish(type) && !isEndish(type)) {
    return false;
  }

  if (isTouch) {
    lastTouchTime = now();
  } else {
    if (shouldRejectClick(lastTouchTime, now())) {
      return false;
    }
  }

  var distance = getDistance(startCoords, event);
  var returnFalse = true;
  if (isEndish(type) && distance < tapMoveThreshold) {
    event.type = "touchTap";
  } else {
    returnFalse = false;
  }
  if (isStartish(type)) {
    startCoords.x = getAxisCoordOfEvent(Axis.x, event);
    startCoords.y = getAxisCoordOfEvent(Axis.y, event);
  } else if (isEndish(type)) {
    startCoords.x = 0;
    startCoords.y = 0;
  }
  return returnFalse && event;
};

export default function injectTapEventPlugin() {
  if (alreadyInjected || typeof window !== "object") return;
  alreadyInjected = true;
  var events = isTouch
    ? ["touchstart", "touchmove", "touchend", "touchcancel"]
    : ["mousedown", "mousemove", "mouseup"];
  events.forEach(function(type) {
    addEvent(window, type, function(e) {
      e.__type__ = "touchtap";
      dispatchEvent(e);
    });
  });

  // touchTap
}

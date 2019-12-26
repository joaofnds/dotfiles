function get_window_under_mouse()
  local _ = hs.application

  local my_pos = hs.geometry.new(hs.mouse.getAbsolutePosition())
  local my_screen = hs.mouse.getCurrentScreen()

  return hs.fnutils.find(hs.window.orderedWindows(), function(w)
                           return my_screen == w:screen() and my_pos:inside(w:frame())
  end)
end

dragging_window = nil

drag_event = hs.eventtap.new(
  {
    hs.eventtap.event.types.leftMouseDragged,
  }, function(e)
    local dx = e:getProperty(hs.eventtap.event.properties.mouseEventDeltaX)
    local dy = e:getProperty(hs.eventtap.event.properties.mouseEventDeltaY)

    dragging_win:move({dx, dy}, nil, false, 0)
end)

flag_event = hs.eventtap.new({ hs.eventtap.event.types.flagsChanged }, function(e)
    local flags = e:getFlags()

    if flags.cmd then
      dragging_win = get_window_under_mouse()
      drag_event:start()
    else
      drag_event:stop()
    end
end)

flag_event:start()

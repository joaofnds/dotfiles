function get_window_under_mouse()
  local pos = hs.geometry.new(hs.mouse.getAbsolutePosition())
  local screen = hs.mouse.getCurrentScreen()

  return hs.fnutils.find(hs.window.orderedWindows(), function(w)
    return screen == w:screen() and pos:inside(w:frame())
  end)
end

dragging_window = nil

drag_event = hs.eventtap.new(
  {
    hs.eventtap.event.types.leftMouseDragged,
    hs.eventtap.event.types.rightMouseDragged,
  }, function(e)
    if not dragging_win then return nil end

    local dx = e:getProperty(hs.eventtap.event.properties.mouseEventDeltaX)
    local dy = e:getProperty(hs.eventtap.event.properties.mouseEventDeltaY)
    local mouse = hs.mouse:getButtons()

    if mouse.left then
      dragging_win:move({dx, dy}, nil, false, 0)
    elseif mouse.right then
      local sz = dragging_win:size()
      local w1 = sz.w + dx
      local h1 = sz.h + dy
      dragging_win:setSize(w1, h1)
    end
end)

flag_event = hs.eventtap.new({ hs.eventtap.event.types.flagsChanged }, function(e)
  local flags = e:getFlags()

  if flags.cmd then
    dragging_win = get_window_under_mouse()
    drag_event:start()
  else
    draggin_win = nil
    drag_event:stop()
  end
end)

flag_event:start()

--------------------------------------------------------------------------------

hs.hotkey.bind({"cmd", "alt", "ctrl"}, "R", function()
  hs.reload()
end)

hs.alert.show("Config Reloaded")

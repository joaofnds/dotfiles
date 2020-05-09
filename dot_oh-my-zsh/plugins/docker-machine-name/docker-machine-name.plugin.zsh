function docker_machine_prompt_info() {
  if [ -n "$DOCKER_MACHINE_NAME" ]; then
    echo "%{$fg_bold[blue]%}docker:(%{$fg[red]%}$DOCKER_MACHINE_NAME%{$fg[blue]%})%{$reset_color%} "
  fi
}

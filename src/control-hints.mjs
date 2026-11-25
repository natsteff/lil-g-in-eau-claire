export function gamepadHints({ menu = false, compact = false, swapped = false } = {}) {
  const confirm = compact ? 'Button 1' : 'A/Cross';
  const back = compact ? 'Button 2' : 'B/Circle';
  if (menu) return `Menu: D-pad/stick navigate · Left/right adjust · ${confirm} select · ${back} back · Start close${compact ? '' : ' · LB sound · RB next track'}`;
  const jump = compact ? (swapped ? 'Button 2' : 'Button 1') : (swapped ? 'X/Square' : 'A/Cross');
  const action = compact ? (swapped ? 'Button 1' : 'Button 2') : (swapped ? 'A/Cross' : 'X/Square');
  return `Move: D-pad/stick · Jump: ${jump} · Action: ${action} · Start pause/resume · ${compact ? 'Select menu' : 'View/Share menu · Y/Triangle → A/Cross restart · LB sound · RB next track'}`;
}

export default interface Hotkey {
  commandName: string;
  commandOptions?: Record<string, unknown>;
  context?: string;
  keys: string[];
  label: string;
  isEditable?: boolean;
}

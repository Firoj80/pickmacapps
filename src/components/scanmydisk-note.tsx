export function featuresScanMyDisk(names: string[]) {
  return names.some((name) => name.trim().toLowerCase() === "scanmydisk");
}

export function ScanMyDiskNote() {
  return <p className="text-[13px] leading-relaxed text-muted">ScanMyDisk is built by the author of this site.</p>;
}

export const value = (n:number, unit:string, digits=0) => `${n.toFixed(digits)} ${unit}`
export const statusClass = (status:string) => status.toLowerCase().replaceAll('_','-')

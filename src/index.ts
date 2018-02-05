import * as cp from 'child_process'
import * as drivelist from 'drivelist'
import { promisify } from 'util'

const list = promisify(drivelist.list)
const execAsync = promisify(cp.exec)

export interface DiskInfo {
	total: number
	used: number
	name: string
	dev: string
}

export default async function getDiskUsage() {
	const result = (await list()) as any[]
	const diskInfoList = result.filter((item) => item.mountpoints && item.mountpoints.length > 0)
	const l: DiskInfo[] = []
	for (const d of diskInfoList) {
		const total = d.size
		const name = d.description
		const dev = d.device
		const mp = d.mountpoints[0]
		const r = await execAsync(`df ${mp.path} | sed '1d'`)
		if (r.stdout && !r.stderr) {
			const u = r.stdout.split(' ').map((s) => s.trim()).filter((s) => !!s)
			if (u.length > 2) {
				const used = parseInt(u[2])
				l.push({
					total,
					name,
					used,
					dev
				})
			}
		}
	}
	return l
}

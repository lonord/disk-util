import * as cp from 'child_process'
import * as debug from 'debug'
import { promisify } from 'util'

const execAsync = promisify(cp.exec)
const log = debug('disk-util')

export interface DiskInfo {
	total: number
	used: number
	name: string
	dev: string
}

export default async function getDiskUsage() {
	const out = (await execAsync('lsblk -J -o NAME,MOUNTPOINT,LABEL')).stdout
	const result = JSON.parse(out).blockdevices
	log('lsblk -J -o NAME,MOUNTPOINT,LABEL -> \n%j', result)
	const l: DiskInfo[] = []
	for (const d of result) {
		await getMountedDiskInfo(d, l)
	}
	return l
}

async function getMountedDiskInfo(disk: any, diskInfoList: DiskInfo[]) {
	if (disk.mountpoint) {
		const r = await execAsync(`df ${disk.mountpoint} | sed '1d'`)
		log(`df ${disk.mountpoint} | sed '1d' ->\n%j`, r)
		if (r.stdout && !r.stderr) {
			const u = r.stdout.split(' ').map((s) => s.trim()).filter((s) => !!s)
			if (u.length > 3) {
				const used = parseInt(u[2])
				const total = parseInt(u[3]) + used
				diskInfoList.push({
					total,
					name: disk.label ? disk.label : getNameFromPath(disk.mountpoint),
					used,
					dev: disk.name
				})
			}
		}
	}
	if (disk.children && disk.children.length > 0) {
		for (const c of disk.children) {
			await getMountedDiskInfo(c, diskInfoList)
		}
	}
}

function getNameFromPath(path: string) {
	const l = path.split('/')
	return l.length > 0 ? l[l.length - 1] : ''
}

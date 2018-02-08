import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const readFileAsync = promisify(fs.readFile)

export interface IOStat {
	dev: string
	tps: number
	read: number
	write: number
}

export interface IOStatWatcher {
	stop()
}

export default async function watchIOStat(interval: number, cb: (stats: IOStat[]) => void) {
	interval = interval || 3000
	let lastStats = await getIOStat()
	let lastTime = new Date().getTime()
	let timer: any = setInterval(() => {
		getIOStat().then((thisStats) => {
			const thisTime = new Date().getTime()
			const stats = calculateIOStat(lastStats, thisStats, thisTime - lastTime)
			lastStats = thisStats
			lastTime = thisTime
			cb && cb(stats)
		})
	}, interval)
	return {
		stop: () => {
			timer && clearInterval(timer)
			timer = undefined
		}
	}
}

function calculateIOStat(lastStats: IOStatItem[], thisStats: IOStatItem[], interval: number) {
	const stats: IOStat[] = []
	const lastStatMap = convertToMap(lastStats)
	for (const stat of thisStats) {
		const lastStat = lastStatMap[stat.dev]
		if (lastStat) {
			stats.push({
				dev: stat.dev,
				tps: Math.floor((stat.rd_ios + stat.wr_ios - lastStat.rd_ios - lastStat.wr_ios) / interval * 1000),
				read: Math.floor((stat.rd_sectors - lastStat.rd_sectors) * 512 / interval * 1000),
				write: Math.floor((stat.wr_sectors - lastStat.wr_sectors) * 512 / interval * 1000)
			})
		}
	}
	return stats
}

function convertToMap(stats: IOStatItem[]) {
	const map: { [key: string]: IOStatItem } = {}
	for (const stat of stats) {
		map[stat.dev] = stat
	}
	return map
}

interface IOStatItem {
	dev: string
	rd_ios: number
	rd_merges: number
	rd_sectors: number
	rd_ticks: number
	wr_ios: number
	wr_merges: number
	wr_sectors: number
	wr_ticks: number
}

async function getIOStat() {
	const statContent = await readFileAsync('/proc/diskstats', 'utf8')
	const lines = statContent.split('\n')
	const items: IOStatItem[] = lines.map((line) => {
		const cols = line.split(' ').map((s) => s.trim()).filter((s) => !!s)
		return {
			dev: cols[2],
			rd_ios: parseInt(cols[3]),
			rd_merges: parseInt(cols[4]),
			rd_sectors: parseInt(cols[5]),
			rd_ticks: parseInt(cols[6]),
			wr_ios: parseInt(cols[7]),
			wr_merges: parseInt(cols[8]),
			wr_sectors: parseInt(cols[9]),
			wr_ticks: parseInt(cols[10])
		}
	})
	return items.filter((item) => item.rd_ios || item.rd_merges || item.rd_sectors || item.rd_ticks || item.wr_ios
		|| item.wr_merges || item.wr_sectors || item.wr_ticks)
}

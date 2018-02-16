import * as assert from 'assert'
import * as fake from 'fake-exec'
import * as fs from 'fs'
import 'mocha'
import * as muk from 'muk'
import { join } from 'path'

fake('lsblk -J -o NAME,MOUNTPOINT,LABEL', {
	stdout: fs.readFileSync(join(__dirname, '../../resource/__test__/lsblk.txt'), 'utf8')
})

fake(`df / | sed '1d'`, {
	stdout: fs.readFileSync(join(__dirname, '../../resource/__test__/root.txt'), 'utf8')
})

fake(`df /boot | sed '1d'`, {
	stdout: fs.readFileSync(join(__dirname, '../../resource/__test__/boot.txt'), 'utf8')
})

fake(`df /media/hdd | sed '1d'`, {
	stdout: fs.readFileSync(join(__dirname, '../../resource/__test__/hdd.txt'), 'utf8')
})

fake(`df /media/timemachine | sed '1d'`, {
	stdout: fs.readFileSync(join(__dirname, '../../resource/__test__/timemachine.txt'), 'utf8')
})

const testResourceDir = join(__dirname, '../../resource/__test__')
const content1 = fs.readFileSync(join(testResourceDir, 'diskstats1.txt'), 'utf8')
const content2 = fs.readFileSync(join(testResourceDir, 'diskstats2.txt'), 'utf8')
const content3 = fs.readFileSync(join(testResourceDir, 'diskstats3.txt'), 'utf8')
let times = 0
muk(fs, 'readFile', (filePath, encode, cb) => {
	if (filePath === '/proc/diskstats') {
		if (times === 0) {
			cb(null, content1)
		} else if (times === 1) {
			cb(null, content2)
		} else if (times === 2) {
			cb(null, content3)
		} else {
			cb(null, content3)
		}
		times++
	}
})

import { getDiskUsage, IOStatWatcher, watchIOStat } from '../'

describe('test', () => {

	it('test-get-disk-usage', async () => {
		const result = await getDiskUsage()
		assert.equal(result.length, 4)
		const disk1 = result[0]
		assert.equal(disk1.name, 'Home')
		assert.equal(disk1.dev, 'sda2')
		assert.equal(disk1.total, 1193011364)
		assert.equal(disk1.used, 37276328)
		const disk2 = result[1]
		assert.equal(disk2.name, 'TimeMachine')
		assert.equal(disk2.dev, 'sda3')
		assert.equal(disk2.total, 532961400)
		assert.equal(disk2.used, 102149496)
		const disk3 = result[2]
		assert.equal(disk3.name, 'boot')
		assert.equal(disk3.dev, 'mmcblk0p6')
		assert.equal(disk3.total, 48081)
		assert.equal(disk3.used, 21473)
		const disk4 = result[3]
		assert.equal(disk4.name, 'root')
		assert.equal(disk4.dev, 'mmcblk0p7')
		assert.equal(disk4.total, 13022008)
		assert.equal(disk4.used, 43602244)
	})

	it('test-get-iostat', () => {
		return new Promise((resolve, reject) => {
			let t = 0
			const watcher: IOStatWatcher = watchIOStat(5000, (stats) => {
				t++
				assert.ok(stats)
				assert.ok(stats.length === 14)
				console.log(JSON.stringify(stats, null, 4))
				if (t > 2) {
					watcher.stop()
					resolve()
				}
			}, reject)
		})
	})

})

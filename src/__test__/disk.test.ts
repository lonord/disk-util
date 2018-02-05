import * as assert from 'assert'
import * as fake from 'fake-exec'
import * as fs from 'fs'
import 'mocha'
import * as path from 'path'
import getDiskUsage from '../'

fake('lsblk -J -o NAME,MOUNTPOINT,LABEL', {
	stdout: fs.readFileSync(path.join(__dirname, '../../resource/__test__/lsblk.txt'), 'utf8')
})

fake(`df / | sed '1d'`, {
	stdout: fs.readFileSync(path.join(__dirname, '../../resource/__test__/root.txt'), 'utf8')
})

fake(`df /boot | sed '1d'`, {
	stdout: fs.readFileSync(path.join(__dirname, '../../resource/__test__/boot.txt'), 'utf8')
})

fake(`df /media/hdd | sed '1d'`, {
	stdout: fs.readFileSync(path.join(__dirname, '../../resource/__test__/hdd.txt'), 'utf8')
})

fake(`df /media/timemachine | sed '1d'`, {
	stdout: fs.readFileSync(path.join(__dirname, '../../resource/__test__/timemachine.txt'), 'utf8')
})

describe('test-get-disk-usage', () => {

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

})

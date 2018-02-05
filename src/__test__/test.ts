import getDiskUsage from '../'

getDiskUsage().then((result) => {
	console.log(JSON.stringify(result, null, 4))
}).catch((err) => console.error(err))

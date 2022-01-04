const fs = require('fs');
const path = require('path');
const isGlob = require('is-glob');
const Buffer = require('buffer');

function isObject(obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}

function addSlashSuffix(str) {
    if (typeof str !== 'string') return str

    if (str[str.length-1] === '/') return str

    return str + '/'
}

function addSlashPrefix(str) {
    if (typeof str !== 'string') return str

    if (str[0] === '/') return str

    return '/' + str
}

function fileTree(source) {
	const tree = {};

	function _iterate(key, val) {
		if (isObject(val)) {
			Object.keys(val).forEach((k) => _iterate(`${key}/${k}`, val[k]));
		} else {
			tree[key] = val;
		}
	}

	if (!isObject(source)) {
		throw new Error('source must be object');
	}

	Object.keys(source).forEach((k) => _iterate(k, source[k]));
	return tree;
}

function archive(archiver, data, target) {
	if (typeof data === 'string') {
		if (fs.existsSync(data)) {
			const stat = fs.lstatSync(data);
			if (stat.isDirectory()) {
				return archiver.directory(addSlashSuffix(data), target);
			}
			return archiver.file(data, {name: target});
		} else {
			if (isGlob(data)) {
				return archiver.glob(data, {cwd: target});
			}
			return archiver.append(data, {name: target});
		}
	} else if (Buffer.isBuffer(data)) {
		return archiver.append(data, {name: target});
	} else {
		return archiver.append(JSON.stringify(data), {name: target});
	}
}

function archiveSource(archiver, source) {
	const tree = fileTree(source);

	Object.keys(tree).forEach((k) => {
		const srcPath = path.join(process.cwd(), k);
		let target;
		if (tree[k] === true) {
			target = k;
		} else if (typeof tree[k] === 'string') {
			target = tree[k];
		}
		archive(archiver, srcPath, addSlashPrefix(target));
	});

	archiver.finalize();
}

module.exports = archiveSource
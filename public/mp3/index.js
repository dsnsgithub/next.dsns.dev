const downloadStatus = document.getElementById("downloadStatus");
const conversionStatus = document.getElementById("conversionStatus");

const round = (number, decimalPlaces) => {
	const factorOfTen = Math.pow(10, decimalPlaces);
	return Math.round(number * factorOfTen) / factorOfTen;
};

// Downloads file with progress bar, splits into chunks
async function downloadAPI(url) {
	let timer = 0;
	const clock = setInterval(() => {
		timer += 1;
		downloadStatus.innerText = "Downloading..." + ` (${timer / 100} seconds)`;
	}, 10);

	const response = await fetch(url);
	clearInterval(clock);

	if (response.status != 200) {
		alert(await response.text());
		downloadStatus.innerText = "Waiting for download to start...";
	}

	let fileName = "";
	for (const pair of response.headers.entries()) {
		if (pair[0].toLowerCase() == "content-disposition") {
			fileName = pair[1].split(`filename="`)[1].split(`.`)[0];
			break;
		}
	}

	const reader = response.body.getReader();
	let receivedLength = 0;
	let chunks = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		chunks.push(value);
		receivedLength += value.length;
		downloadStatus.innerText = "Downloaded " + round(receivedLength / 1000000, 2) + "MB";
	}

	downloadStatus.innerText = "Download Complete";
	return [chunks, receivedLength, fileName];
}

async function convertChunkToArray(chunks, receivedLength) {
	let chunksAll = new Uint8Array(receivedLength); // (4.1)
	let position = 0;
	for (let chunk of chunks) {
		chunksAll.set(chunk, position); // (4.2)
		position += chunk.length;
	}

	return chunksAll;
}

async function downloadMP3() {
	try {
		const downloadLink = document.getElementById("downloadLink").value;
		let youtubeID = "";

		if (downloadLink.indexOf("youtu.be") > -1) {
			youtubeID = downloadLink.split("youtu.be/")[1]?.slice(0, 11);
		} else if (downloadLink.indexOf("youtube.com") > -1) {
			if (downloadLink.indexOf("shorts") > -1) {
				youtubeID = downloadLink.split("shorts/")[1]?.slice(0, 11);
			} else {
				youtubeID = downloadLink.split("?v=")[1]?.slice(0, 11);
			}
		}

		if (!youtubeID) {
			alert("Invalid YouTube Link");
			return;
		}

		const fileType = document.getElementById("fileType").value;

		const mp4play = document.getElementById("mp4play");

		const [chunks, receivedLength, fileName] = await downloadAPI(`/api/youtubeVideo/${youtubeID}`);
		const chunksAll = await convertChunkToArray(chunks, receivedLength);
		const result = JSON.parse(new TextDecoder("utf-8").decode(chunksAll));

		mp4play.src = result["highest"]["url"];
		mp4play.style.display = "block";

		if (fileType == "mp4audio") window.open(result["highest"]["url"], "_blank");
		if (fileType == "mp4high") window.open(result["highestvideo"]["url"], "_blank");
		if (fileType == "webm") window.open(result["highestaudio"]["url"], "_blank");
	} catch (e) {
		console.error(e);
	}
}

const downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener("click", downloadMP3);

document.onkeyup = function (event) {
	if (event.key == "Enter") {
		event.preventDefault();
		downloadMP3();
	}
};

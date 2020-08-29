import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
	Grid,
	Container,
	Button,
	AppBar,
	Toolbar,
	Typography,
	TextField,
	ListItem,
	ListItemText,
	Box,
	List,
	Avatar,
	ListItemAvatar,
	FormLabel,
	Radio,
	FormControl,
	RadioGroup,
	FormControlLabel,
	Slider,
	Checkbox,
	InputLabel,
	Accordion,
	AccordionSummary,
	Select
} from '@material-ui/core';
import { Stage, Layer, Text } from 'react-konva';
import { makeStyles } from '@material-ui/styles';
import { PDFDocument, rgb, RotationTypes, degrees } from 'pdf-lib';
import { PictureAsPdfRounded, AttachFile, CloudDownload, ExpandMore } from '@material-ui/icons';
import { DropzoneDialog } from 'material-ui-dropzone';
import { Document, Page, pdfjs } from 'react-pdf';
import { SketchPicker } from 'react-color';

function PDFEditor() {
	const [ allFiles, setFiles ] = useState([]);
	const [ text, setText ] = useState('Watermark');
	const [ selected, setSelected ] = useState();
	const [ watermarkColor, setWatermarkColor ] = useState('#FF0000');
	const [ pageSize, setPageSize ] = useState({ width: 600, height: 600 });
	// const [ ratio, setRation ] = useState(1);
	const [ showColorPicker, setShowColorPicker ] = useState(false);
	const [ fontSize, setFontSize ] = useState(40);
	const [ opacity, setOpacity ] = useState(0.3);
	const [ angle, setAngle ] = useState(45);
	const [ watermarkPosition, setWatermarkPosition ] = useState({
		x: pageSize.height / 2 - fontSize,
		y: pageSize.width / 2 - getTextWidth(text, fontSize) / 2 - fontSize * Math.sin(angle * (Math.PI / 180))
	});
	const [ activeWatermark, setActiveWatermark ] = useState(false);
	const [ activePageRemove, setActivePageRemove ] = useState(false);

	const [ defaultText, setDefaultText ] = useState('Geleverd aan');
	const [ defaultTextColor, setDefaultTextColor ] = useState('#000000');
	const [ defaultTextSize, setDefaultTextSize ] = useState(11);
	const [ showDefaultTextColorPicker, setShowDefaultTextColorPicker ] = useState(false);
	const [ defaultTextPosition, setDefaultTextPosition ] = useState({
		x: pageSize.width / 2 - getTextWidth(defaultText, defaultTextSize) / 2,
		y: 0
	});

	const [ importantPages, setImportantPages ] = useState('');
	const [ numberOfRemovePage, setNumberOfRemovePage ] = useState(0);

	useEffect(
		() => {
			selectItem();
		},
		[ selected ]
	);

	const [ dropzone, setDropzone ] = useState({
		open: false,
		files: []
	});

	pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
	const useStyle = makeStyles({
		wrap: {
			wordBreak: 'break-all'
		},
		height: {
			height: '100vh',
			maxHeight: '100vh'
		},
		pdfPage: {
			border: 'solid #898989',
			borderWidth: '8px'
		}
	});

	const colorPickerCssMaker = makeStyles({
		color: {
			width: '32px',
			height: '18px',
			borderRadius: '2px',
			background: `${watermarkColor}`
		},
		defaultTextColor: {
			width: '32px',
			height: '18px',
			borderRadius: '2px',
			background: `${defaultTextColor}`
		},
		swatch: {
			padding: '2px',
			background: '#fff',
			borderRadius: '1px',
			boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
			display: 'inline-block',
			cursor: 'pointer'
		},
		popover: {
			position: 'absolute',
			zIndex: '2'
		},
		cover: {
			position: 'fixed',
			top: '0px',
			right: '0px',
			bottom: '0px',
			left: '0px'
		}
	});

	const classes = useStyle();

	const colorPickerCss = colorPickerCssMaker();

	function submitFile(files) {
		handleDropzone();
		setFiles(allFiles.concat(files));

		if (files.length > 0 && isNaN(selected)) {
			setSelected(0);
		}
	}

	async function selectItem() {
		if (allFiles.length > 0) {
			const buffer = await allFiles[selected].arrayBuffer();

			const doc = await PDFDocument.load(buffer);

			const page = doc.getPage(0);

			const size = page.getSize();

			if (page.getRotation().angle % 180 === 0) {
				var ratio = 600 / size.width;

				var height = size.height * ratio;

				// setRation(ratio);
				setPageSize({ width: 600, height: height });
			} else {
				var ratio = 600 / size.height;

				var height = size.width * ratio;

				// setRation(ratio);
				setPageSize({ width: 600, height: height });
			}
		}
	}

	function handleDropzone() {
		setDropzone({
			open: !dropzone.open
		});
	}

	async function process() {
		if (allFiles.length > 0) {
			const buffer = await allFiles[selected].arrayBuffer();

			const doc = await PDFDocument.load(buffer);

			////remove pages
			if (activePageRemove) {
				let important = importantPages.split(' ').join('');

				important = importantPages.split(',');

				for (let n in important) {
					if (isNaN(important[n]) || important[n] === '') {
						important.splice(n, 1);
					} else if (Number(important[n] > doc.getPageCount())) {
						important.splice(n, 1);
					} else {
						important[n] = Number(important[n]);
					}
				}

				if (numberOfRemovePage + important.length >= doc.getPageCount()) {
					console.log('invalid input');
					return;
				}

				//generate random numbers
				var randomRemoveList = [];
				while (randomRemoveList.length < numberOfRemovePage) {
					var r = Math.floor(Math.random() * doc.getPageCount()) + 1;
					if (randomRemoveList.indexOf(r) === -1 && important.indexOf(r) === -1) randomRemoveList.push(r);
				}

				//sort
				randomRemoveList.sort(function(a, b) {
					return b - a;
				});

				for (let n of randomRemoveList) {
					doc.removePage(n - 1);
				}
			}
			//remove pages end

			for (let page of doc.getPages()) {
				console.log(page.getRotation().angle);
				let lRatio;
				if (page.getRotation().angle === 0) {
					lRatio = 600 / page.getSize().width;
					console.log(`width ${page.getSize().width}`);
				} else {
					lRatio = 600 / page.getSize().height;
					console.log(`height ${page.getSize().width}`);
				}

				// lRatio = 600 / page.getSize().width;

				const watermarkRotation = {
					type: RotationTypes.Degrees,
					angle: angle + page.getRotation().angle
				};

				const defaultTextRotation = {
					type: RotationTypes.Degrees,
					angle: page.getRotation().angle
				};

				const { x, y } = generatePosition(page);

				const { defaultTextX, defaultTextY } = generateDefaultTextPosition(page);

				console.log(`ratio ${lRatio}`);

				console.log(`x ${defaultTextX / lRatio}`);
				console.log(`y ${defaultTextY / lRatio}`);

				page.drawText(defaultText, {
					x: defaultTextX / lRatio,
					y: defaultTextY / lRatio,
					lineHeight: defaultTextSize / lRatio,
					color: generateColorForPdf(defaultTextColor),
					size: defaultTextSize / lRatio,
					rotate: defaultTextRotation
				});

				if (activeWatermark) {
					page.drawText(text, {
						x: x / lRatio,
						y: y / lRatio,
						opacity: opacity,
						color: generateColorForPdf(watermarkColor),
						lineHeight: fontSize / lRatio,
						rotate: watermarkRotation,
						size: fontSize / lRatio
					});
				}
			}
			// return;

			const dl = await doc.save();

			require('downloadjs')(dl, allFiles[selected].name, 'application/pdf');
		}
	}

	function getTextWidth(text, font) {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');

		context.font = font || getComputedStyle(document.body).font;

		return context.measureText(text).width;
	}

	function generatePosition(page) {
		//for font size and angle
		let radianAngle = angle * (Math.PI / 180);
		let x;
		let y;

		if (page.getRotation().angle === 0) {
			x = watermarkPosition.x + fontSize * Math.cos(radianAngle);
			y = pageSize.height - watermarkPosition.y + fontSize * Math.sin(radianAngle);
		} else {
			x = watermarkPosition.y + fontSize * Math.cos(radianAngle);
			y = watermarkPosition.x + fontSize * Math.sin(radianAngle);
		}

		return {
			x: x,
			y: y
		};
	}

	function generateDefaultTextPosition(page) {
		let x;
		let y;

		if (page.getRotation().angle === 0) {
			x = defaultTextPosition.x;
			y = pageSize.height - defaultTextPosition.y - defaultTextSize;
		} else {
			x = defaultTextPosition.y + defaultTextSize;
			y = defaultTextPosition.x;
		}

		return {
			defaultTextX: x,
			defaultTextY: y
		};
	}

	function generateColorForPdf(colorHex) {
		let r = parseInt(colorHex.substring(1, 3), 16) / 255;
		let g = parseInt(colorHex.substring(3, 5), 16) / 255;
		let b = parseInt(colorHex.substring(5, 7), 16) / 255;

		return rgb(r, g, b);
	}

	function getFiles() {
		return allFiles.map((file, index) => {
			return (
				<ListItem key={index} divider button onClick={() => setSelected(index)} selected={selected === index}>
					<ListItemAvatar>
						<Avatar>
							<PictureAsPdfRounded />
						</Avatar>
					</ListItemAvatar>
					<ListItemText className={classes.wrap} primary={file.name} secondary={'Size: ' + file.size} />
				</ListItem>
			);
		});
	}

	return (
		<Box component="div" style={{ width: '100%' }}>
			<Box width={1280} style={{ margin: '0 auto' }}>
				<AppBar position="static">
					<Toolbar>
						<Typography variant="h6" color="inherit">
							AlbersenIC
						</Typography>
					</Toolbar>
				</AppBar>

				<Box component="div" display="inline-block">
					<Box
						component="div"
						display="inline-block"
						style={{ verticalAlign: 'top', backgroundColor: '#898989', minHeight: '600px' }}
						width={300}
						marginRight={2}
					>
						<Button
							startIcon={<AttachFile />}
							fullWidth
							variant="contained"
							color="secondary"
							onClick={handleDropzone}
						>
							Add PDF
						</Button>
						<DropzoneDialog
							open={dropzone.open}
							onSave={submitFile}
							acceptedFiles={[ 'application/pdf' ]}
							filesLimit={500}
							showPreviews={true}
							maxFileSize={5000000000}
							onClose={handleDropzone}
						/>
						<List style={{ maxHeight: '600px', overflow: 'auto' }}>{getFiles()}</List>
					</Box>

					<Box component="div" display="inline-block" style={{ verticalAlign: 'top' }} width={648}>
						<Box>
							<Box position="absolute" zIndex={-1} className={classes.pdfPage}>
								<Document file={allFiles[selected]}>
									<Page pageNumber={1} width={pageSize.width} />
								</Document>
							</Box>
							<Box position="absolute" className={classes.pdfPage}>
								<Stage height={pageSize.height} width={pageSize.width}>
									<Layer>
										<Text
											text={defaultText}
											draggable
											fontSize={defaultTextSize}
											fill={defaultTextColor}
											x={defaultTextPosition.x}
											y={defaultTextPosition.y}
											onDragEnd={(e) => {
												setDefaultTextPosition({
													x: e.target.x(),
													y: e.target.y()
												});
											}}
										/>
									</Layer>
									{activeWatermark ? (
										<Layer>
											<Text
												text={text}
												draggable
												fontSize={fontSize}
												opacity={opacity}
												fill={watermarkColor}
												x={watermarkPosition.x}
												y={watermarkPosition.y}
												rotation={-angle}
												onDragEnd={(e) => {
													setWatermarkPosition({
														x: e.target.x(),
														y: e.target.y()
													});
												}}
											/>
										</Layer>
									) : null}
								</Stage>
							</Box>
						</Box>
					</Box>

					<Box
						component="div"
						display="inline-block"
						style={{ verticalAlign: 'top' }}
						width={300}
						marginLeft={2}
					>
						<Accordion expanded>
							<AccordionSummary expandIcon={<ExpandMore />}>Geleverd aan</AccordionSummary>
							<Box padding={2} style={{ backgroundColor: '#AAAAAA' }}>
								<Box display="inline" marginY={2}>
									<Typography variant="subtitle2">Text color </Typography>
									<div
										className={colorPickerCss.swatch}
										onClick={() => {
											setShowDefaultTextColorPicker(!showDefaultTextColorPicker);
										}}
									>
										<div className={colorPickerCss.defaultTextColor} />
									</div>
									{showDefaultTextColorPicker ? (
										<div className={colorPickerCss.popover}>
											<div
												className={colorPickerCss.cover}
												onClick={() => {
													setShowDefaultTextColorPicker(!showDefaultTextColorPicker);
												}}
											/>
											<SketchPicker
												color={defaultTextColor}
												onChange={(color) => setDefaultTextColor(color.hex)}
											/>
										</div>
									) : null}
								</Box>
								<Box marginY={2}>
									<TextField
										label="Text Size"
										size="small"
										variant="outlined"
										value={defaultTextSize}
										onChange={(event) => {
											let number = Number(event.target.value);

											if (!isNaN(number) && number < 101) {
												setDefaultTextSize(number);
											}
										}}
									/>
								</Box>
								<Box marginY={2}>
									<TextField
										size="small"
										label="Text"
										variant="outlined"
										value={defaultText}
										placeholder="Text to show"
										multiline
										onChange={(event) => setDefaultText(event.target.value)}
									/>
								</Box>
							</Box>
						</Accordion>

						<Accordion>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<FormControlLabel
									aria-label="Watermark"
									onClick={(event) => event.stopPropagation()}
									onFocus={(event) => event.stopPropagation()}
									control={
										<Checkbox
											checked={activeWatermark}
											onChange={(event) => setActiveWatermark(event.target.checked)}
										/>
									}
									label="Watermark"
								/>
							</AccordionSummary>

							<Box padding={2} style={{ backgroundColor: '#898989' }}>
								<Box>
									<Typography variant="subtitle2">Watermark Color</Typography>
									<div
										className={colorPickerCss.swatch}
										onClick={() => {
											setShowColorPicker(!showColorPicker);
										}}
									>
										<div className={colorPickerCss.color} />
									</div>
									{showColorPicker ? (
										<div className={colorPickerCss.popover}>
											<div
												className={colorPickerCss.cover}
												onClick={() => {
													setShowColorPicker(!showColorPicker);
												}}
											/>
											<SketchPicker
												color={watermarkColor}
												onChange={(color) => setWatermarkColor(color.hex)}
											/>
										</div>
									) : null}
								</Box>
								<Box marginY={2}>
									<TextField
										size="small"
										label="Watermark Size"
										variant="outlined"
										value={fontSize}
										onChange={(event) => {
											let number = Number(event.target.value);

											if (!isNaN(number) && number < 101) {
												setFontSize(number);
											}
										}}
									/>
								</Box>
								<Box marginY={2}>
									<TextField
										label="watermark"
										size="small"
										variant="outlined"
										value={text}
										placeholder="Text to show"
										multiline
										onChange={(event) => setText(event.target.value)}
									/>
								</Box>

								<Box marginY={2}>
									<Typography variant="subtitle2">Opacity</Typography>
									<Slider
										value={opacity}
										min={0.05}
										step={0.001}
										max={1}
										onChange={(event, value) => {
											setOpacity(value);
										}}
									/>
								</Box>
								<Box marginY={2}>
									<Typography variant="subtitle2">Rotation</Typography>
									<Slider
										value={angle}
										min={0}
										step={45}
										marks
										max={360}
										onChange={(event, value) => {
											setAngle(value);
										}}
									/>
								</Box>
							</Box>
						</Accordion>

						<Accordion>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<FormControlLabel
									aria-label="Page Remove"
									onClick={(event) => event.stopPropagation()}
									onFocus={(event) => event.stopPropagation()}
									control={
										<Checkbox
											checked={activePageRemove}
											onChange={(event) => setActivePageRemove(event.target.checked)}
										/>
									}
									label="Page Remove"
								/>
							</AccordionSummary>

							<Box padding={2} style={{ backgroundColor: '#898989' }}>
								<Box marginY={2}>
									<TextField
										label="Important pages"
										size="small"
										variant="outlined"
										value={importantPages}
										placeholder="1,2,3"
										multiline
										helperText="write pages separated by coma such: 1,2,3"
										onChange={(event) => setImportantPages(event.target.value)}
									/>
								</Box>
								<Box marginY={2}>
									<TextField
										label="Number of Pages to remove"
										size="small"
										variant="outlined"
										value={numberOfRemovePage}
										placeholder="Number of page"
										multiline
										helperText="Write how many page to remove"
										onChange={(event) => {
											let number = Number(event.target.value);

											if (!isNaN(number)) {
												setNumberOfRemovePage(number);
											}
										}}
									/>
								</Box>
							</Box>
						</Accordion>

						<Box marginTop={3} marginBottom={3}>
							<Button
								startIcon={<CloudDownload />}
								fullWidth
								variant="contained"
								color="primary"
								onClick={process}
							>
								Save PDF
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

export default PDFEditor;

if (document.getElementById('root')) {
	ReactDOM.render(<PDFEditor />, document.getElementById('root'));
}

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
	Slider
} from '@material-ui/core';
import { Stage, Layer, Text } from 'react-konva';
import { makeStyles } from '@material-ui/styles';
import { PDFDocument, rgb, RotationTypes } from 'pdf-lib';
import { PictureAsPdfRounded, AttachFile, CloudDownload } from '@material-ui/icons';
import { DropzoneDialog } from 'material-ui-dropzone';
import { Document, Page, pdfjs } from 'react-pdf';
import { SketchPicker } from 'react-color';

function PDFEditor() {
	const [ allFiles, setFiles ] = useState([]);
	const [ text, setText ] = useState('Type Something');
	const [ selected, setSelected ] = useState();
	const [ watermarkColor, setWatermarkColor ] = useState('#000000');
	const [ watermarkPosition, setWatermarkPosition ] = useState({ x: 0, y: 50 });
	const [ pageSize, setPageSize ] = useState({ width: 600, height: 600 });
	const [ ratio, setRation ] = useState(1);
	const [ showColorPicker, setShowColorPicker ] = useState(false);
	const [ fontSize, setFontSize ] = useState(20);
	const [ opacity, setOpacity ] = useState(1);
	const [ angle, setAngle ] = useState(0);

	const [ defaultText, setDefaultText ] = useState('Default text');
	const [ defaultTextPosition, setDefaultTextPosition ] = useState({ x: 0, y: 0 });
	const [ defaultTextColor, setDefaultTextColor ] = useState('#000000');
	const [ defaultTextSize, setDefaultTextSize ] = useState(11);
	const [ showDefaultTextColorPicker, setShowDefaultTextColorPicker ] = useState(false);

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
			width: '64px',
			height: '32px',
			borderRadius: '2px',
			background: `${watermarkColor}`
		},
		defaultTextColor: {
			width: '64px',
			height: '32px',
			borderRadius: '2px',
			background: `${defaultTextColor}`
		},
		swatch: {
			padding: '5px',
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

			var ratio = 600 / size.width;

			var height = size.height * ratio;

			setRation(ratio);
			setPageSize({ width: 600, height: height });
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

			const rotation = {
				type: RotationTypes.Degrees,
				angle: -angle
			};

			console.log(rotation);

			for (let page of doc.getPages()) {
				const { x, y } = generatePosition();

				const { defaultTextX, defaultTextY } = generateDefaultTextPosition();

				page.drawText(text, {
					x: x / ratio,
					y: y / ratio,
					opacity: opacity,
					color: generateColorForPdf(watermarkColor),
					rotate: rotation,
					size: fontSize / ratio
				});

				page.drawText(defaultText, {
					x: defaultTextX / ratio,
					y: defaultTextY / ratio,
					color: generateColorForPdf(defaultTextColor),
					size: defaultTextSize / ratio
				});
			}

			const dl = await doc.save();

			require('downloadjs')(dl, allFiles[selected].name, 'application/pdf');
		}
	}

	function generatePosition() {
		//for font size and angle
		let radianAngle = angle * (Math.PI / 180);

		let x = watermarkPosition.x + fontSize * Math.cos(radianAngle);
		let y = pageSize.height - watermarkPosition.y + fontSize * Math.sin(radianAngle);

		return {
			x: x,
			y: y
		};
	}

	function generateDefaultTextPosition() {
		let x = defaultTextPosition.x;
		let y = pageSize.height - defaultTextPosition.y - defaultTextSize;
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
		<Container fixed maxWidth="lg" className={classes.height}>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<AppBar position="static">
						<Toolbar>
							<Typography variant="h6" color="inherit">
								PDF Editor
							</Typography>
						</Toolbar>
					</AppBar>
				</Grid>

				<Grid container spacing={2} style={{ width: '2000px !important' }}>
					<Grid container item xs={3} spacing={1} direction="column" alignItems="center">
						<Grid container item>
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
						</Grid>

						<List style={{ maxHeight: '90vh', overflow: 'auto' }}>{getFiles()}</List>
					</Grid>

					<Grid item container xs={7} direction="column">
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
									<Layer>
										<Text
											text={text}
											draggable
											fontSize={fontSize}
											opacity={opacity}
											fill={watermarkColor}
											x={watermarkPosition.x}
											y={watermarkPosition.y}
											rotation={angle}
											onDragEnd={(e) => {
												setWatermarkPosition({
													x: e.target.x(),
													y: e.target.y()
												});
											}}
										/>
									</Layer>
								</Stage>
							</Box>
						</Box>
					</Grid>

					<Grid item xs={2} container alignItems="center">
						<Grid container item>
							{/* <Grid item>
								<FormControl component="fieldset">
									<FormLabel component="legend">Watermark Position</FormLabel>
									<RadioGroup aria-label="position" name="position">
										<FormControlLabel value="top-left" control={<Radio />} label="Top Left" />
										<FormControlLabel value="top-right" control={<Radio />} label="Top Right" />
										<FormControlLabel value="bottom-left" control={<Radio />} label="Bottom Left" />
										<FormControlLabel
											value="bottom-right"
											control={<Radio />}
											label="Bottom Right"
										/>
									</RadioGroup>
								</FormControl>
							</Grid> */}

							<Grid item style={{ backgroundColor: '#AAAAAA' }}>
								<Typography variant="h6">Default Text Size</Typography>
								<TextField
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

								<Typography variant="h6">Default text color </Typography>
								<div>
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
								</div>

								<TextField
									size="small"
									variant="outlined"
									value={defaultText}
									placeholder="Text to show"
									multiline
									onChange={(event) => setDefaultText(event.target.value)}
								/>
							</Grid>

							<Grid item style={{ backgroundColor: '#898989' }}>
								<Typography variant="h6">Watermark SIze</Typography>
								<TextField
									size="small"
									variant="outlined"
									value={fontSize}
									onChange={(event) => {
										let number = Number(event.target.value);

										if (!isNaN(number) && number < 101) {
											setFontSize(number);
										}
									}}
								/>

								<Typography variant="h6">Choose Color</Typography>
								<div>
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
								</div>

								<TextField
									size="small"
									variant="outlined"
									value={text}
									placeholder="Text to show"
									multiline
									onChange={(event) => setText(event.target.value)}
								/>

								<Typography variant="h6">Opacity</Typography>
								<Slider
									value={opacity}
									min={0.05}
									step={0.001}
									max={1}
									onChange={(event, value) => {
										setOpacity(value);
									}}
								/>

								<Typography variant="h6">Rotation</Typography>
								<Slider
									value={angle}
									min={0}
									step={0.001}
									max={360}
									onChange={(event, value) => {
										setAngle(value);
									}}
								/>

								<Box marginTop={3}>
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
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</Container>
	);
}

export default PDFEditor;

if (document.getElementById('root')) {
	ReactDOM.render(<PDFEditor />, document.getElementById('root'));
}

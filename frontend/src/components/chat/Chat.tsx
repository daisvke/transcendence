import {
	useContext, useEffect, useState, useRef
			} from 'react';
import * as React from 'react';
import {
	Box, List, ListItem, TextField, Button, Dialog, DialogActions,
	DialogContent, DialogContentText,	DialogTitle, ListItemIcon,
	ListItemText, ListItemButton, CssBaseline, ListItemSecondaryAction, Modal, Typography, Stack
			} from '@mui/material';
import {
	TagRounded, LockRounded, ArrowForwardIos, AddCircleOutline,
	LockOpenRounded, Person2Rounded
			} from '@mui/icons-material';

// personal components
import { UserContext } from '../../contexts/UserContext';
import { WebSocketContext } from '../../contexts/WebsocketContext';
import ChatRoom from './ChatRoom';
import PleaseLogin from '../pages/PleaseLogin';
import { ChatRoomType } from "../../types/chat";
// personal css
import './Chat.css';
import { ModalClose, ModalDialog } from '@mui/joy';
import { LoadingButton } from '@mui/lab';

/*************************************************************
 * Chat entrance
 
 * It is the entrance for chat rooms.
 * Users can create/join chat rooms.
**************************************************************/

interface WinProps {
	window?: () => Window;
}
const Chat = () => {
	/*************************************************************
	 * Chat entrance
	 
	 * It is the entrance for chat rooms.
	 * Users can create/join chat rooms.
	************************************************************/
	/*************************************************************
	 * States
	 **************************************************************/
	// Fetching the socket from its context
	const socket = useContext(WebSocketContext)
	// Fetching the user profile from its context
	const { user, setUser } = useContext(UserContext);
	// Array including all chat rooms
	const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
	// Tells whether the user has joined the chatroom
	const joinedRoomName = user.joinedChatRoom;

	// Create chat room
	const [chatRoomCreateMode, setChatRoomCreateMode] = useState<boolean>(false);
	const [newChatRoomName, setNewChatRoomName] = useState<string>('');
	const [chatRoomPassword, setChatRoomPassword] = useState<string>('');

	// Join chat room
	const [isPasswordProtected, setIsPasswordProtected] =
		useState<boolean>(false);
	const [inputPassword, setInputPassword] = useState<string>('');
	const [isPasswordRight, setIsPasswordRight] = useState<boolean>(false);
	const [clickedRoomToJoin, setclickedRoomToJoin] = useState<string>('');


	socket.emit('findAllChatRooms', {}, (response: ChatRoomType[]) => {
		setChatRooms(response);
	});

	const [open, setOpen] = React.useState(false);
	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};
	const [openP, setOpenPass] = React.useState(false);
	const handleClickOpenP = () => {
		setOpenPass(true);
	};
	const handleClosePass = () => {
		setOpenPass(false);
	};
	/*************************************************************
	 * Event listeners
	 **************************************************************/
	useEffect(() => {
		// Activate listeners and subscribe to events as the component is mounted
		socket.on('connect', () => console.log('Connected to websocket'));
		socket.on('createChatRoom', (roomName: string) => {
			console.log('Created new chat room [' + roomName + ']');
		});
		socket.on('exception', ({ msg }) => {
			console.log('ERROR: ' + msg)
		})

		// Clean listeners to unsubscribe all callbacks for these events
		// before the component is unmounted
		return () => {
			socket.off('connect');
			socket.off('createChatRoom');
			socket.off('exception')
		};
	}, []);

	// When clicking on the 'new' button to create a new chat room
	const onNewClick = () => {
		setChatRoomCreateMode(true);
		handleClickOpen();
	};
	
	const onChatRoomCreateModeSubmit = (e: any) => {
		e.preventDefault();
		if (newChatRoomName)
			socket.emit('createChatRoom', {
				room: {
					name: newChatRoomName,
					modes: '',
					password: chatRoomPassword,
					userLimit: 0,
					users: {},
					messages: [],
					bannedNicks: []
				},
				nick: user.nickname,
				user2: ''
			});
		setNewChatRoomName('');
		setChatRoomCreateMode(false);
		setChatRoomPassword('');
	};
	// Handle value changes of the input fields during new chatroom create mode
	const onValueChange = (type: string, value: string) => {
		if (type === 'name') setNewChatRoomName(value);
		if (type === 'password') setChatRoomPassword(value);
	};
	const onClickJoinRoom = (roomName: string) => {
		// Notify that the user has clicked on a 'join' button
		handleClickOpenP();
		setclickedRoomToJoin(roomName);
		// Check if the corresponding chat room is password protected
		socket.emit(
			'isPasswordProtected',
			{ roomName: roomName },
			(response: boolean) => {
				setIsPasswordProtected(response);
			}
			);
			isPasswordProtected === false ? joinRoom(roomName) : onPasswordSubmit(null);
	};
	// Join a chatroom if no password has been set
	const joinRoom = (roomName: string) => {
		socket.emit(
			'joinRoom',
			{ roomName: roomName, nickName: user.nickname },
			(response: string) => {
				user.joinedChatRoom = response;
			}
			);
	};
	// Check if the password is right
	const onPasswordSubmit = (e : any) => {
		e.preventDefault();
		socket.emit(
			'checkPassword',
			{ roomName: clickedRoomToJoin, password: inputPassword },
			(response: boolean) => {
				response === true
					? setIsPasswordRight(true) 
					: setIsPasswordRight(false);
			}
		);
		if (isPasswordRight) joinRoom(clickedRoomToJoin);
		setInputPassword('');
		handleClosePass();

	};

	const getMemberNbr = (room: ChatRoomType) => {
		let memberNbr = 0;
		for (const user in room.users)
			if (room.users[user].isOnline === true)
				memberNbr += 1;
		return memberNbr;
	}

	const isAuthorizedPrivRoom = (mode: string, users: any) => {
		if ((mode).indexOf('i') !== -1) {
			for (const nick in users)
				if (nick === user.nickname) return true;
		}
		else return true;
		return false;
	}
	
	const cleanRoomLoginData = () => {
		user.joinedChatRoom = '';
		setIsPasswordProtected(false);
		setIsPasswordRight(false);
	};
	// console.log(user.joinedChatRoom + ' ' + clickedRoomToJoin)
	/*************************************************************
	 * Render HTML response
	**************************************************************/
	return !user.provider ? (
<PleaseLogin />
	) : (
			<Box id="basicCard">
				<CssBaseline />
				<Box component="main" id="chatRoomList">
					{chatRooms.length === 0 ? (
						<Box>
							<List>
								<ListItem>
									<ListItemText
										primary={
											'No channel joined. Click to the + button for create one.'
										}
										sx={{ color: 'white' }}
									/>
								</ListItem>
							</List>
						</Box>
					) : (
						<Box>
							<List>
								{/* Mapping chatroom array to retrieve all chatrooms with */}
								{chatRooms.map(
									(room: ChatRoomType, index) => (
									// Check if this isn't a private conversation of other users
									isAuthorizedPrivRoom(room.modes, room.users) &&
									<>
									<ListItem key={index} disablePadding>
										<ListItemIcon sx={{ color: 'white' }}>
											{
											room.modes === "p" ? (
												<LockRounded />
											) : room.modes === "i" ? (
												<Person2Rounded />) : (
												<TagRounded />
											) }
										</ListItemIcon>
										{clickedRoomToJoin === room.name &&
											room.modes.indexOf('p') !== -1 && (
												// if the room is already joined, don't display the password dialog
												<div>
													<Modal
														className='black'
														open={openP}
														onClose={handleClosePass}>
														<ModalDialog
															aria-labelledby="basic-modal-dialog-title"
															className="modal-style">
															<ModalClose onClick={handleClosePass}/>
															<Typography 
										            id="basic-modal-dialog-title"
																component="h2"
																className="modal-title">
																Enter password
																</Typography>
																<form onSubmit={onPasswordSubmit}>
																	<Stack spacing={2}>
																		<Typography component="h3" sx={{ color: 'rgb(37, 120, 204)' }}>
																			Type the Room password
																		</Typography>
																		<Stack spacing={1}>
																			<Typography>
																				Please enter the password to join this channel
																			</Typography>
																			<div>
																			</div>
																		</Stack>
																		<TextField
																			autoFocus
																			required
																			type="password"
																			inputRef={(input) => {
																				if (input != null) input.focus();
																			}}
																			value={inputPassword}
																			inputProps={{
																				minLength: 6,
																				maxLength: 6
																			}}
																			placeholder="Password"
																			// helperText={error} // error message
																			// error={!!error} // set to true to change the border/helperText color to red
																			onChange={(e) =>
																				setInputPassword(e.target.value)
																			}
																		/>
																		<LoadingButton
																			type="submit"
																			onClick={onPasswordSubmit}
																			startIcon={<LockOpenRounded />}
																			variant="contained"
																			color="inherit"
																		>
																			SEND
																		</LoadingButton>
																	</Stack>
																</form>
														</ModalDialog>

													</Modal>
												</div>
											)}
										<ListItemButton onClick={() => onClickJoinRoom(room.name)}>
											<ListItemText
												tabIndex={-1}
												primary={
													room.name[0] === '#' ? room.name.slice(1) : room.name
													// Slicing the '#' character at position 0 which is
													// used for private room names
												}
												className="limitText white"
												/>
											<ListItemIcon sx={{ color: 'white' }}>
												<ArrowForwardIos />
											</ListItemIcon>
										</ListItemButton>
									</ListItem>
									</>
								))}
							</List>
						</Box>
					)}
					{/* Button that gets into chatroom create mode */}
					{chatRooms.length <
						parseInt(process.env.REACT_APP_MAX_CHATROOM_NBR!) && (
						<Button onClick={onNewClick} sx={{ color: 'white' }}>
							<AddCircleOutline />
						</Button>
					)}
					{/* Chatroom create mode form */}
					{chatRoomCreateMode && (
						<div>
							<Modal
								className='black'
								open={open}
								onSubmit={onChatRoomCreateModeSubmit}
								onClose={handleClose}>
								<ModalDialog
									aria-labelledby="basic-modal-dialog-title"
									className="modal-style">
									<ModalClose onClick={handleClose}/>
									<Typography 
										id="basic-modal-dialog-title"
										component="h2"
										className="modal-title">
										Create room
										</Typography>
										<form onSubmit={onPasswordSubmit}>
											<Stack spacing={2}>
												<Stack spacing={1}>
												<Typography component="h3" sx={{ color: 'rgb(37, 120, 204)' }}>
													Type the Room name
												</Typography>
												<TextField
													autoFocus
													required={true}
													helperText="Limit 20 characters"
													inputProps={{ inputMode: 'text', maxLength: 20 }}
													
													id="name"
													type="name"
													value={newChatRoomName}
													// helperText={error} // error message
													// error={!!error} // set to true to change the border/helperText color to red
													onChange={(e) => onValueChange('name', e.target.value)}
												/>
												</Stack>
												<Stack spacing={1}>
													<Typography component="h3" sx={{ color: 'rgb(37, 120, 204)' }}>
													
													</Typography>
													<Typography>
													Your are free to add a password or not.
													</Typography>
													<TextField
													type="password"
													value={chatRoomPassword}
													placeholder="Password"
													// helperText={error} // error message
													// error={!!error} // set to true to change the border/helperText color to red
													onChange={(e) => onValueChange('password', e.target.value)}
												/>
												</Stack>
												<LoadingButton
													type="submit"
													onClick={onChatRoomCreateModeSubmit}
													startIcon={<LockOpenRounded />}
													variant="contained"
													color="inherit"
												>
													CREATE
												</LoadingButton>
											</Stack>
										</form>
								</ModalDialog>
							</Modal>
					</div>
					)}
				</Box>
				<Box component="main" id="chatRoom">
					{joinedRoomName &&
					((isPasswordProtected && isPasswordRight) || !isPasswordProtected) ? (
						<ChatRoom cleanRoomLoginData={cleanRoomLoginData} />
					) : (
						<div className="black">
							<h2>Actually no room joined</h2>
							<p>To join a room click on the arrow on the left</p>
							<p>Or add a new chan with the + button</p>
						</div>
					)}
				</Box>
			</Box>  );
};

export default Chat;

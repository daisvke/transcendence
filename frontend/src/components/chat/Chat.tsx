import {
  useContext,
  useEffect,
  useState,
  Fragment,
  useRef
} from 'react';
import * as React from 'react';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  Toolbar,
  Typography,
  ListItem,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CssBaseline,
  FormLabel
} from '@mui/material';
import {
  ChatRounded,
  TagRounded,
  LockRounded,
  ArrowForwardIos,
  AddCircleOutline,
  LockOpenRounded,
  KeyboardDoubleArrowRightRounded,
  MailLockRounded
} from '@mui/icons-material';
// personal components
import { UserContext } from '../../contexts/UserContext';
import { WebSocketContext } from '../../contexts/WebsocketContext';
import MenuIcon from '@mui/icons-material/Menu';
import ChatRoom from './ChatRoom';
import PleaseLogin from '../pages/PleaseLogin';
import { ChatRoomType } from "../../types/chat";


/*************************************************************
 * Chat entrance
 
 * It is the entrance for chat rooms.
 * Users can create/join chat rooms.
**************************************************************/
// import ChanBar from './ChanBar';
// personal css
import './Chat.css';

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

  // Enter in chatroom create mode
  const [chatRoomCreateMode, setChatRoomCreateMode] = useState<boolean>(false);
  const [newChatRoomName, setNewChatRoomName] = useState<string>('');
  const [chatRoomPassword, setChatRoomPassword] = useState<string>('');
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
        mode: ''
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
    setclickedRoomToJoin(roomName);
    handleClickOpenP();
    // Check if the corresponding chat room is password protected
    socket.emit(
      'isPasswordProtected',
      { roomName: roomName },
      (response: boolean) => {
        setIsPasswordProtected(response);
      }
    );
    isPasswordProtected === false ? joinRoom(roomName) : onPasswordSubmit();
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
  const onPasswordSubmit = () => {
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
  };

  const getMemberNbr = (room: ChatRoomType) => {
    let memberNbr = 0;
    for (const user in room.users)
      if (room.users[user].isOnline === true)
        memberNbr += 1;
    return memberNbr;
  }

  const cleanRoomLoginData = () => {
    user.joinedChatRoom = '';
    setIsPasswordProtected(false);
    setIsPasswordRight(false);
  };
  /*************************************************************
   * Render HTML response
   **************************************************************/
  return !user.provider ? (
    <PleaseLogin />
  ) : (
    <Fragment>
      <Box className="basicCard" sx={{ display: 'flex' }}>
        <CssBaseline />
        {/* TODO: move sx style in css file */}
        <Box component="main" className="chatRoomList">
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
                {chatRooms.map((room, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ color: 'white' }}>
                      {Object.values(room.modes).indexOf('p') !== -1 ? (
                        <LockRounded />
                      ) : (
                        <TagRounded />
                      )}
                    </ListItemIcon>
                    {clickedRoomToJoin === room.name &&
                      Object.values(room.modes).indexOf('p') !== -1 && (
                        <>
                          <Dialog
                            open={openP}
                            onClose={handleClosePass}
                            onSubmit={onPasswordSubmit}
                          >
                            <DialogTitle>Enter password</DialogTitle>
                            <DialogContent>
                              <DialogContentText>
                                Please enter the password to join this channel
                              </DialogContentText>
                              <TextField
                                autoFocus
                                margin="dense"
                                id="password"
                                label="Password"
                                type="password"
                                fullWidth
                                value={inputPassword}
                                onChange={(e) =>
                                  setInputPassword(e.target.value)
                                }
                              />
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={handleClosePass}>Cancel</Button>
                              <Button onClick={onPasswordSubmit}>Join</Button>
                            </DialogActions>
                          </Dialog>
                        </>
                      )}
                    <ListItem onClick={() => onClickJoinRoom(room.name)}>
                      <ListItemText
                        tabIndex={-1}
                        primary={room.name}
                        className="limitText"
                        sx={{ color: 'white' }}
                      />
                      <ListItemButton sx={{ color: 'white' }}>
                        <ArrowForwardIos />
                      </ListItemButton>
                    </ListItem>
                  </ListItem>
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
            <Dialog
              open={open}
              onClose={handleClose}
              onSubmit={onChatRoomCreateModeSubmit}
            >
              <DialogTitle>Create room</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Your are free to add a password or not to this chatroom.
                </DialogContentText>
                <TextField
                  autoFocus
                  required={true}
                  helperText="Limit 20 characters"
                  inputProps={{ inputMode: 'text', maxLength: 20 }}
                  margin="dense"
                  id="name"
                  label="Chatroom name"
                  type="name"
                  value={newChatRoomName}
                  onChange={(e) => onValueChange('name', e.target.value)}
                  fullWidth
                  variant="standard"
                />
                <TextField
                  margin="dense"
                  id="password"
                  label="Room password"
                  type="password"
                  value={chatRoomPassword}
                  onChange={(e) => onValueChange('password', e.target.value)}
                  fullWidth
                  variant="standard"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={onChatRoomCreateModeSubmit}>Create</Button>
              </DialogActions>
            </Dialog>
          )}
        </Box>
        <Box component="main" className="chatRoom">
          {joinedRoomName &&
          ((isPasswordProtected && isPasswordRight) || !isPasswordProtected) ? (
            <ChatRoom
              cleanRoomLoginData={cleanRoomLoginData}
            />
          ) : (
            <>
              <h2>Actually no room joined</h2>
              <p>To join a room click on the arrow on the left</p>
              <p>Or add a new chan with the + button</p>
            </>
          )}
        </Box>
      </Box>
    </Fragment>
  );
};

export default Chat;

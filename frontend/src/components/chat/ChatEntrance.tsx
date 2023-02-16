import { SetStateAction, useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import ChatRoom from "./ChatRoom";

// // All newly created message should have an author and the message itself
// export type MessagePayload = {
// 	author: string
// 	data: string
// }

/*************************************************************
 * Chat entrance
 
 * It is the entrance for chat rooms.
 * Users can create/join chat rooms.
**************************************************************/
const ChatEntrance = () => {

  /*************************************************************
   * States
  **************************************************************/
  // Fetching the socket from its context
  const socket = useContext(WebSocketContext)
  // Fetching the user profile from its context
  const { user, setUser } = useContext(UserContext)

  // Array including all chat rooms
  const [chatRooms, setChatRooms] = useState<any[]>([])
  // Tells whether the user has joined the chatroom
  const [joinedRoom, setJoinedRoom] = useState<any>()

  // Enter in chatroom create mode
  const [chatRoomCreateMode, setChatRoomCreateMode] = useState<boolean>(false)
  const [newChatRoomName, setNewChatRoomName] = useState<string>('')
  const [chatRoomPassword, setChatRoomPassword] = useState<string>('')
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false)
  const [inputPassword, setInputPassword] = useState<string>('')
  const [isPasswordRight, setIsPasswordRight] = useState<boolean>(false)
  const [joinRoomClicked, setJoinRoomClicked] = useState<string>('')

  socket.emit('findAllChatRooms', {}, (response: SetStateAction<any[]>) => {
    setChatRooms(response)
  })


  /*************************************************************
   * Event listeners
  **************************************************************/
  useEffect(() => {
    socket.on('connect', () => console.log('Connected to websocket'))
    
    socket.on('createChatRoom', (roomName: string) => {
      console.log('Created new chat room [' + roomName + ']')
    })

    socket.on('joinRoom', (roomName: string) => {
      setJoinedRoom(roomName)
      console.log(user.nickname + ' joined chatroom [' + roomName + ']')
    })

    // socket.on('quitRoom', (userName: string) => {
    //   if (userName === user.nickname)
    //   {
    //     console.log(userName + ' quit room [' + joinedRoom.name + ']')
    //     setJoinedRoom('')
    //   }
    // })

    // Clean listeners to avoid multiple activations
    return () => {
      socket.off('connect')
      socket.off('createChatRoom')
      socket.off('joinRoom')
      socket.off('quitRoom')
    }
  }, [])

  const onNewClick = () => setChatRoomCreateMode(true)

  const onChatRoomCreateModeSubmit = (e: any) => {
    e.preventDefault()
    if (newChatRoomName)
      socket.emit('createChatRoom', { name: newChatRoomName,
                                      modes: '',
                                      password: chatRoomPassword,
                                      userLimit: 0,
                                      users: {},
                                      banList: [],
                                      messages: [] })
    setNewChatRoomName('')
    setChatRoomCreateMode(false)
    setChatRoomPassword('')
  }

  // Handle value changes of the input fields during new chatroom create mode
  const onValueChange = (type: string, value: string) => {
    if (type === 'name')
      setNewChatRoomName(value)
    if (type === 'password')
      setChatRoomPassword(value)
  }

  const onClickJoinRoom = (roomName: string) => {
    // Notify that the user has clicked on a 'join' button
    setJoinRoomClicked(roomName)

    // Check if that the corresponding chat room is password protected
    socket.emit('isPasswordProtected', { roomName: roomName },
    (response: SetStateAction<boolean>) => {
  console.log('isprotec?? '+ response)

    setIsPasswordProtected(response)
  console.log('isprotec2 ?? '+ response)

  console.log('isprotec3 ?? '+ isPasswordProtected)
  })

    if (isPasswordProtected === false) joinRoom(roomName)
}

  // Join a chatroom if no password has been set
  const joinRoom = (roomName: string) => {
    socket.emit('joinRoom',
      { roomName: roomName, user: user },
      (response: SetStateAction<any>) => {
      setJoinedRoom(response)
    })
  }
  // const checkIfJoinedRoom(roomName: string)

  // Check if the password is right
  const onPasswordSubmit = (e: any) => {
    e.preventDefault()
    socket.emit('checkPassword',
      { roomName: joinRoomClicked, password: inputPassword },
      (response: SetStateAction<boolean>) => {
        response === true ? setIsPasswordRight(true) : setIsPasswordRight(false)
      }
    )
    setInputPassword('')
  }

  const cleanRoomLoginData = () => {
    setJoinedRoom('')
    setIsPasswordProtected(false)
    setIsPasswordRight(false)
  }

  
  /*************************************************************
   * HTML response
  **************************************************************/
  return (
    <div className='baseCard'>
        <h1>Let's chat together right now</h1>

              { // If user has joined and given the right password,
                // or no password is asked, then display the room
                ((joinedRoom && ((isPasswordProtected && isPasswordRight) || !isPasswordProtected))) ?
                <ChatRoom user={ user } room={ joinedRoom } cleanRoomLoginData={ cleanRoomLoginData } /> :

              (<div>
                {
                  chatRooms.length === 0 ? (<div>No channel</div>) : (
                    <ul>
                      { // Mapping chatroom array to retrieve all chatrooms with
                        chatRooms.map((room, index) => (
                          <li key={ index }>
                            [{ room.name }]: { Object.keys(room.users).length } members
                            | { Object.keys(room.messages).length } messages
                            { Object.values(room.modes).indexOf('p') !== -1 ? '| PWD ' : ' ' }

                                      {
            joinRoomClicked === room.name &&
            Object.values(room.modes).indexOf('p') !== -1 &&
            (
                  <form onSubmit={ onPasswordSubmit }>
                    <label htmlFor="password">password</label>
                    <input type="password"
                      id="password"
                      value={ inputPassword }
                      onChange={ (e) => setInputPassword(e.target.value) }
                    />
                    <button type="submit">access</button>
                  </form>
            )
          }


                            <button onClick={ () => onClickJoinRoom(room.name) }>join</button>
                          </li>
                        ))
                      }
                    </ul>
                )}

                { // Button that gets into chatroom create mode 
                  chatRooms.length < parseInt(process.env.REACT_APP_MAX_CHATROOM_NBR!)
                    && <button onClick={ onNewClick }>new</button>
                }
                
                { // Chatroom create mode form
                  chatRoomCreateMode &&
                  <form onSubmit={ onChatRoomCreateModeSubmit }>
                    <label htmlFor="roomCreateSubmit">name</label>
                    <input type="text"
                      id="rommCreateSubmit"
                      value={ newChatRoomName }
                      onChange={ (e) => onValueChange('name', e.target.value) }
                    />

                    <label htmlFor="password">password</label>
                    <input type="password"
                      id="password"
                      value={ chatRoomPassword }
                      onChange={ (e) => onValueChange('password', e.target.value) }
                    />

                    <button type="submit">create</button>
                  </form>
                }
              </div>)
            
          }
    </div>
  )
}

export default ChatEntrance

import { useState, useContext, SetStateAction, Dispatch } from 'react';
import { UserContext } from '../../contexts/UserContext';
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import TextField from '@mui/material/TextField';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import errorAlert from '../UI/errorAlert';
import backendAPI from '../../api/axios-instance';
import * as MUI from '../UI/MUIstyles';
import axios from 'axios';

const EditNickname = ({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { setUser } = useContext(UserContext);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [load, setLoad] = useState(false);
  const [buttonText, setButtonText] = useState('Submit');

  const handleTextInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue.match(/^[A-Za-z0-9_-]*$/)) {
      setText(newValue);
      setError('');
    } else {
      setError('Allowed: A-Z _ a-z - 0-9');
    }
  };

  const warningNameUsed = () => {
    setOpen(false);
    errorAlert('This nickname is already used');
  };

  const warningWentWrong = () => {
    setOpen(false);
    errorAlert('Something went wrong');
  };

  const setNickname = (value: string) => {
    return backendAPI.patch('/user/setnickname', { nickname: value }).then(
      (response) => {
        setUser(response.data);
      },
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          warningNameUsed();
        } else {
          warningWentWrong();
        }
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (text) {
      setLoad(true);
      await setNickname(text);
      setLoad(false);
      setButtonText('Done ✔️');
    }
    setText('');
    setError('');
    setTimeout(() => setOpen(false), 442);
    setTimeout(() => setButtonText('Submit'), 442);
  };

  return (
    <div>
      <Modal
        sx={{ color: 'black' }}
        open={open}
        onClose={(event, reason) => {
          if (event && reason === 'closeClick') {
            setError('');
            setOpen(false);
          }
        }}
      >
        <ModalDialog
          aria-labelledby="basic-modal-dialog-title"
          sx={MUI.modalDialog}
        >
          <ModalClose sx={MUI.modalClose} />
          <Typography sx={MUI.modalHeader}>Modifying nickname</Typography>
          <form style={{ marginTop: '10px' }} onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FormLabel sx={{ color: 'black' }}>
                    3 - 10 characters:
                  </FormLabel>
                </Box>
                <div style={MUI.loadButtonBlock}>
                  <TextField
                    autoFocus
                    required
                    value={text}
                    inputProps={{
                      minLength: 3,
                      maxLength: 10
                    }}
                    helperText={error} // error message
                    error={!!error} // set to true to change the border/helperText color to red
                    onChange={handleTextInput}
                  />
                </div>
              </FormControl>
              <div style={MUI.loadButtonBlock}>
                <LoadingButton
                  type="submit"
                  loading={load}
                  startIcon={<SaveIcon />}
                  variant="contained"
                  color="inherit"
                  sx={{ minWidth: 142 }}
                >
                  {buttonText}
                </LoadingButton>
              </div>
            </Stack>
          </form>
        </ModalDialog>
      </Modal>
    </div>
  );
};

export default EditNickname;

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface CreateItemGroupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { co_name: string; co_email_id: string; co_id?: number }) => void;
  initialData?: { co_name: string; co_email_id: string; co_id?: number } | null;
}

const CreateItemGroup: React.FC<CreateItemGroupProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [coName, setCoName] = useState('');
  const [coEmailId, setCoEmailId] = useState('');

  useEffect(() => {
    if (initialData) {
      setCoName(initialData.co_name || '');
      setCoEmailId(initialData.co_email_id || '');
    } else {
      setCoName('');
      setCoEmailId('');
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ co_name: coName, co_email_id: coEmailId, co_id: initialData?.co_id });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initialData ? 'Edit Item Group' : 'Create Item Group'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Item Group Code"
            value={coName}
            onChange={e => setCoName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Item Group Name"
            value={coEmailId}
            onChange={e => setCoEmailId(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button type="submit" variant="contained" className='btn-primary'>
            {initialData ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateItemGroup;

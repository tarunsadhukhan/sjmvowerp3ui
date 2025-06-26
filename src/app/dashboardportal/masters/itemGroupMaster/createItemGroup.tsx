import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface CreateItemGroupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { item_grp_code_display: string; item_grp_name_display: string; item_grp_id?: number }) => void;
  initialData?: { item_grp_code_display: string; item_grp_name_display: string; item_grp_id?: number } | null;
}

const CreateItemGroup: React.FC<CreateItemGroupProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialData) {
      setCode(initialData.item_grp_code_display || '');
      setName(initialData.item_grp_name_display || '');
    } else {
      setCode('');
      setName('');
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ item_grp_code_display: code, item_grp_name_display: name, item_grp_id: initialData?.item_grp_id });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initialData ? 'Edit Item Group' : 'Create Item Group'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Item Group Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Item Group Name"
            value={name}
            onChange={e => setName(e.target.value)}
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

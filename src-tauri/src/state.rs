use serde::Serialize;
use serialport::{self, SerialPort};
use std::sync::{mpsc::Sender, Mutex};


#[derive(Default)]
pub struct Connection(pub Mutex<Option<SerialPortClient>>);

pub struct SerialPortClient {
  pub serialport: Box<dyn SerialPort>,
  pub sender: Option<Sender<usize>>,
}

#[derive(Serialize, Clone)]
pub struct ReadData<'a> {
  pub data: &'a [u8],
  pub size: usize,
}

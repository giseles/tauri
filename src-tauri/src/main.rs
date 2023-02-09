#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serialport::{DataBits, FlowControl, Parity, StopBits};
use std::time::Duration;
use crate::state::{SerialPortClient, Connection};
use tauri::State;

mod state;

// https://docs.rs/serialport/4.2.0/serialport/index.html#enums
// 数据位
fn get_data_bits(value: Option<usize>) -> DataBits {
  match value {
    Some(value) => match value {
      5 => DataBits::Five,
      6 => DataBits::Six,
      7 => DataBits::Seven,
      8 => DataBits::Eight,
      _ => DataBits::Eight,
    },
    None => DataBits::Eight,
  }
}

// 控制位
fn get_flow_control(value: Option<String>) -> FlowControl {
  match value {
    Some(value) => match value.as_str() {
      "Software" => FlowControl::Software,
      "Hardware" => FlowControl::Hardware,
      _ => FlowControl::None,
    },
    None => FlowControl::None,
  }
}

// 校验位
fn get_parity(value: Option<String>) -> Parity {
  match value {
    Some(value) => match value.as_str() {
      "Odd" => Parity::Odd,
      "Even" => Parity::Even,
      _ => Parity::None,
    },
    None => Parity::None,
  }
}

// 停止位
fn get_stop_bits(value: Option<usize>) -> StopBits {
  match value {
    Some(value) => match value {
      1 => StopBits::One,
      2 => StopBits::Two,
      _ => StopBits::Two,
    },
    None => StopBits::Two,
  }
}

// 可用的串口列表
#[tauri::command]
fn get_ports() -> Vec<String> {
  let mut list = match serialport::available_ports() {
    Ok(list) => list,
    Err(_) => vec![],
  };
  list.sort_by(|a, b| a.port_name.cmp(&b.port_name));

  let mut name_list: Vec<String> = vec![];
  for i in &list {
    name_list.push(i.port_name.clone());
  }

  name_list
}

// 打开串口
#[tauri::command]
fn open_port(
  _app_handle: tauri::AppHandle,
  _window: tauri::Window,
  connection: State<'_, Connection>,
  path: String,
  baud_rate: u32,
  data_bits: Option<usize>,
  flow_control: Option<String>,
  parity: Option<String>,
  stop_bits: Option<usize>,
  timeout: Option<u64>,
) -> bool {
  match serialport::new(path.clone(), baud_rate)
    .data_bits(get_data_bits(data_bits))
    .flow_control(get_flow_control(flow_control))
    .parity(get_parity(parity))
    .stop_bits(get_stop_bits(stop_bits))
    .timeout(Duration::from_millis(timeout.unwrap_or(200)))
    .open()
  {
    Ok(port) => {
      *connection.0.lock().unwrap() = Some(SerialPortClient {
        serialport: port,
        sender: None
      });
      true
    }
    Err(_) => {
      false
    }
  }
}

// 关闭串口
#[tauri::command]
fn close_port(
  _app_handle: tauri::AppHandle,
  _window: tauri::Window,
  connection: State<'_, Connection>,
) {
  *connection.0.lock().unwrap() = None;
}

// 写入串口
#[tauri::command]
fn write_port(
  _app_handle: tauri::AppHandle,
  _window: tauri::Window,
  connection: State<'_, Connection>,
  value: String,
) {
  match connection
    .0
    .lock()
    .unwrap()
    .as_mut()
    .expect("connection not initialize; use the `open_port` command first")
    .serialport
    .write(value.as_bytes())
  {
    Ok(size) => {
      println!("Write successed {}", size)
    }
    Err(_) => {
      println!("Write failed")
    }
  }
}

// 读取串口
#[tauri::command]
fn read_port(
  _app_handle: tauri::AppHandle,
  _window: tauri::Window,
  connection: State<'_, Connection>,
  size: Option<usize>,
) {
  let mut serial_buf: Vec<u8> = vec![0; size.unwrap_or(1024)];

  match connection
    .0
    .lock()
    .unwrap()
    .as_mut()
    .expect("connection not initialize; use the `open_port` command first")
    .serialport
    .read(serial_buf.as_mut_slice())
  {
    Ok(t) => {
      println!("Read successed {:?}", &serial_buf[..t])
    },
    Err(e) => eprintln!("{:?}", e),
  }
}

fn main() {
  tauri::Builder::default()
    .manage(Connection(Default::default()))
    // This is where you pass in your commands
    .invoke_handler(tauri::generate_handler![get_ports, open_port, close_port, write_port, read_port])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

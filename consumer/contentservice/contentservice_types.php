<?php
/**
 * Autogenerated by Thrift Compiler (0.7.0)
 *
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
 */
include_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';


class srcPromptsSet {
  static $_TSPEC;

  public $prompts = null;
  public $filters = null;

  public function __construct($vals=null) {
    if (!isset(self::$_TSPEC)) {
      self::$_TSPEC = array(
        1 => array(
          'var' => 'prompts',
          'type' => TType::MAP,
          'ktype' => TType::STRING,
          'vtype' => TType::STRING,
          'key' => array(
            'type' => TType::STRING,
          ),
          'val' => array(
            'type' => TType::STRING,
            ),
          ),
        2 => array(
          'var' => 'filters',
          'type' => TType::STRING,
          ),
        );
    }
    if (is_array($vals)) {
      if (isset($vals['prompts'])) {
        $this->prompts = $vals['prompts'];
      }
      if (isset($vals['filters'])) {
        $this->filters = $vals['filters'];
      }
    }
  }

  public function getName() {
    return 'srcPromptsSet';
  }

  public function read($input)
  {
    $xfer = 0;
    $fname = null;
    $ftype = 0;
    $fid = 0;
    $xfer += $input->readStructBegin($fname);
    while (true)
    {
      $xfer += $input->readFieldBegin($fname, $ftype, $fid);
      if ($ftype == TType::STOP) {
        break;
      }
      switch ($fid)
      {
        case 1:
          if ($ftype == TType::MAP) {
            $this->prompts = array();
            $_size0 = 0;
            $_ktype1 = 0;
            $_vtype2 = 0;
            $xfer += $input->readMapBegin($_ktype1, $_vtype2, $_size0);
            for ($_i4 = 0; $_i4 < $_size0; ++$_i4)
            {
              $key5 = '';
              $val6 = '';
              $xfer += $input->readString($key5);
              $xfer += $input->readString($val6);
              $this->prompts[$key5] = $val6;
            }
            $xfer += $input->readMapEnd();
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 2:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->filters);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        default:
          $xfer += $input->skip($ftype);
          break;
      }
      $xfer += $input->readFieldEnd();
    }
    $xfer += $input->readStructEnd();
    return $xfer;
  }

  public function write($output) {
    $xfer = 0;
    $xfer += $output->writeStructBegin('srcPromptsSet');
    if ($this->prompts !== null) {
      if (!is_array($this->prompts)) {
        throw new TProtocolException('Bad type in structure.', TProtocolException::INVALID_DATA);
      }
      $xfer += $output->writeFieldBegin('prompts', TType::MAP, 1);
      {
        $output->writeMapBegin(TType::STRING, TType::STRING, count($this->prompts));
        {
          foreach ($this->prompts as $kiter7 => $viter8)
          {
            $xfer += $output->writeString($kiter7);
            $xfer += $output->writeString($viter8);
          }
        }
        $output->writeMapEnd();
      }
      $xfer += $output->writeFieldEnd();
    }
    if ($this->filters !== null) {
      $xfer += $output->writeFieldBegin('filters', TType::STRING, 2);
      $xfer += $output->writeString($this->filters);
      $xfer += $output->writeFieldEnd();
    }
    $xfer += $output->writeFieldStop();
    $xfer += $output->writeStructEnd();
    return $xfer;
  }

}

class srcReportSet {
  static $_TSPEC;

  public $controller = null;
  public $simbaxmlRaw = null;
  public $requestxmlRaw = null;

  public function __construct($vals=null) {
    if (!isset(self::$_TSPEC)) {
      self::$_TSPEC = array(
        1 => array(
          'var' => 'controller',
          'type' => TType::STRING,
          ),
        2 => array(
          'var' => 'simbaxmlRaw',
          'type' => TType::STRING,
          ),
        3 => array(
          'var' => 'requestxmlRaw',
          'type' => TType::STRING,
          ),
        );
    }
    if (is_array($vals)) {
      if (isset($vals['controller'])) {
        $this->controller = $vals['controller'];
      }
      if (isset($vals['simbaxmlRaw'])) {
        $this->simbaxmlRaw = $vals['simbaxmlRaw'];
      }
      if (isset($vals['requestxmlRaw'])) {
        $this->requestxmlRaw = $vals['requestxmlRaw'];
      }
    }
  }

  public function getName() {
    return 'srcReportSet';
  }

  public function read($input)
  {
    $xfer = 0;
    $fname = null;
    $ftype = 0;
    $fid = 0;
    $xfer += $input->readStructBegin($fname);
    while (true)
    {
      $xfer += $input->readFieldBegin($fname, $ftype, $fid);
      if ($ftype == TType::STOP) {
        break;
      }
      switch ($fid)
      {
        case 1:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->controller);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 2:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->simbaxmlRaw);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 3:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->requestxmlRaw);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        default:
          $xfer += $input->skip($ftype);
          break;
      }
      $xfer += $input->readFieldEnd();
    }
    $xfer += $input->readStructEnd();
    return $xfer;
  }

  public function write($output) {
    $xfer = 0;
    $xfer += $output->writeStructBegin('srcReportSet');
    if ($this->controller !== null) {
      $xfer += $output->writeFieldBegin('controller', TType::STRING, 1);
      $xfer += $output->writeString($this->controller);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->simbaxmlRaw !== null) {
      $xfer += $output->writeFieldBegin('simbaxmlRaw', TType::STRING, 2);
      $xfer += $output->writeString($this->simbaxmlRaw);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->requestxmlRaw !== null) {
      $xfer += $output->writeFieldBegin('requestxmlRaw', TType::STRING, 3);
      $xfer += $output->writeString($this->requestxmlRaw);
      $xfer += $output->writeFieldEnd();
    }
    $xfer += $output->writeFieldStop();
    $xfer += $output->writeStructEnd();
    return $xfer;
  }

}

class contentService_InvalidValueException extends TException {
  static $_TSPEC;

  public $error_code = null;
  public $error_msg = null;

  public function __construct($vals=null) {
    if (!isset(self::$_TSPEC)) {
      self::$_TSPEC = array(
        1 => array(
          'var' => 'error_code',
          'type' => TType::I32,
          ),
        2 => array(
          'var' => 'error_msg',
          'type' => TType::STRING,
          ),
        );
    }
    if (is_array($vals)) {
      if (isset($vals['error_code'])) {
        $this->error_code = $vals['error_code'];
      }
      if (isset($vals['error_msg'])) {
        $this->error_msg = $vals['error_msg'];
      }
    }
  }

  public function getName() {
    return 'contentService_InvalidValueException';
  }

  public function read($input)
  {
    $xfer = 0;
    $fname = null;
    $ftype = 0;
    $fid = 0;
    $xfer += $input->readStructBegin($fname);
    while (true)
    {
      $xfer += $input->readFieldBegin($fname, $ftype, $fid);
      if ($ftype == TType::STOP) {
        break;
      }
      switch ($fid)
      {
        case 1:
          if ($ftype == TType::I32) {
            $xfer += $input->readI32($this->error_code);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 2:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->error_msg);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        default:
          $xfer += $input->skip($ftype);
          break;
      }
      $xfer += $input->readFieldEnd();
    }
    $xfer += $input->readStructEnd();
    return $xfer;
  }

  public function write($output) {
    $xfer = 0;
    $xfer += $output->writeStructBegin('contentService_InvalidValueException');
    if ($this->error_code !== null) {
      $xfer += $output->writeFieldBegin('error_code', TType::I32, 1);
      $xfer += $output->writeI32($this->error_code);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->error_msg !== null) {
      $xfer += $output->writeFieldBegin('error_msg', TType::STRING, 2);
      $xfer += $output->writeString($this->error_msg);
      $xfer += $output->writeFieldEnd();
    }
    $xfer += $output->writeFieldStop();
    $xfer += $output->writeStructEnd();
    return $xfer;
  }

}

?>
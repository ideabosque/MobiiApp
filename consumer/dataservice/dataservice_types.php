<?php
/**
 * Autogenerated by Thrift Compiler (0.7.0)
 *
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
 */
include_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';


class srcDataset {
  static $_TSPEC;

  public $appName = null;
  public $requestxmlRaw = null;
  public $simbaxmlRaw = null;
  public $viewName = null;
  public $viewType = null;
  public $dataxmlRaw = null;

  public function __construct($vals=null) {
    if (!isset(self::$_TSPEC)) {
      self::$_TSPEC = array(
        1 => array(
          'var' => 'appName',
          'type' => TType::STRING,
          ),
        2 => array(
          'var' => 'requestxmlRaw',
          'type' => TType::STRING,
          ),
        3 => array(
          'var' => 'simbaxmlRaw',
          'type' => TType::STRING,
          ),
        4 => array(
          'var' => 'viewName',
          'type' => TType::STRING,
          ),
        5 => array(
          'var' => 'viewType',
          'type' => TType::STRING,
          ),
        6 => array(
          'var' => 'dataxmlRaw',
          'type' => TType::STRING,
          ),
        );
    }
    if (is_array($vals)) {
      if (isset($vals['appName'])) {
        $this->appName = $vals['appName'];
      }
      if (isset($vals['requestxmlRaw'])) {
        $this->requestxmlRaw = $vals['requestxmlRaw'];
      }
      if (isset($vals['simbaxmlRaw'])) {
        $this->simbaxmlRaw = $vals['simbaxmlRaw'];
      }
      if (isset($vals['viewName'])) {
        $this->viewName = $vals['viewName'];
      }
      if (isset($vals['viewType'])) {
        $this->viewType = $vals['viewType'];
      }
      if (isset($vals['dataxmlRaw'])) {
        $this->dataxmlRaw = $vals['dataxmlRaw'];
      }
    }
  }

  public function getName() {
    return 'srcDataset';
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
            $xfer += $input->readString($this->appName);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 2:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->requestxmlRaw);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 3:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->simbaxmlRaw);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 4:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->viewName);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 5:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->viewType);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 6:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->dataxmlRaw);
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
    $xfer += $output->writeStructBegin('srcDataset');
    if ($this->appName !== null) {
      $xfer += $output->writeFieldBegin('appName', TType::STRING, 1);
      $xfer += $output->writeString($this->appName);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->requestxmlRaw !== null) {
      $xfer += $output->writeFieldBegin('requestxmlRaw', TType::STRING, 2);
      $xfer += $output->writeString($this->requestxmlRaw);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->simbaxmlRaw !== null) {
      $xfer += $output->writeFieldBegin('simbaxmlRaw', TType::STRING, 3);
      $xfer += $output->writeString($this->simbaxmlRaw);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->viewName !== null) {
      $xfer += $output->writeFieldBegin('viewName', TType::STRING, 4);
      $xfer += $output->writeString($this->viewName);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->viewType !== null) {
      $xfer += $output->writeFieldBegin('viewType', TType::STRING, 5);
      $xfer += $output->writeString($this->viewType);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->dataxmlRaw !== null) {
      $xfer += $output->writeFieldBegin('dataxmlRaw', TType::STRING, 6);
      $xfer += $output->writeString($this->dataxmlRaw);
      $xfer += $output->writeFieldEnd();
    }
    $xfer += $output->writeFieldStop();
    $xfer += $output->writeStructEnd();
    return $xfer;
  }

}

class srcQueryset {
  static $_TSPEC;

  public $appName = null;
  public $savedFilters = null;
  public $prompts = null;
  public $columnSelector = null;
  public $drillColumn = null;
  public $srcXml = null;
  public $viewName = null;
  public $viewType = null;
  public $sql = null;
  public $resultXml = null;

  public function __construct($vals=null) {
    if (!isset(self::$_TSPEC)) {
      self::$_TSPEC = array(
        1 => array(
          'var' => 'appName',
          'type' => TType::STRING,
          ),
        2 => array(
          'var' => 'savedFilters',
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
        3 => array(
          'var' => 'prompts',
          'type' => TType::LST,
          'etype' => TType::MAP,
          'elem' => array(
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
          ),
        4 => array(
          'var' => 'columnSelector',
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
        5 => array(
          'var' => 'drillColumn',
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
        6 => array(
          'var' => 'srcXml',
          'type' => TType::STRING,
          ),
        7 => array(
          'var' => 'viewName',
          'type' => TType::STRING,
          ),
        8 => array(
          'var' => 'viewType',
          'type' => TType::STRING,
          ),
        9 => array(
          'var' => 'sql',
          'type' => TType::STRING,
          ),
        10 => array(
          'var' => 'resultXml',
          'type' => TType::STRING,
          ),
        );
    }
    if (is_array($vals)) {
      if (isset($vals['appName'])) {
        $this->appName = $vals['appName'];
      }
      if (isset($vals['savedFilters'])) {
        $this->savedFilters = $vals['savedFilters'];
      }
      if (isset($vals['prompts'])) {
        $this->prompts = $vals['prompts'];
      }
      if (isset($vals['columnSelector'])) {
        $this->columnSelector = $vals['columnSelector'];
      }
      if (isset($vals['drillColumn'])) {
        $this->drillColumn = $vals['drillColumn'];
      }
      if (isset($vals['srcXml'])) {
        $this->srcXml = $vals['srcXml'];
      }
      if (isset($vals['viewName'])) {
        $this->viewName = $vals['viewName'];
      }
      if (isset($vals['viewType'])) {
        $this->viewType = $vals['viewType'];
      }
      if (isset($vals['sql'])) {
        $this->sql = $vals['sql'];
      }
      if (isset($vals['resultXml'])) {
        $this->resultXml = $vals['resultXml'];
      }
    }
  }

  public function getName() {
    return 'srcQueryset';
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
            $xfer += $input->readString($this->appName);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 2:
          if ($ftype == TType::MAP) {
            $this->savedFilters = array();
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
              $this->savedFilters[$key5] = $val6;
            }
            $xfer += $input->readMapEnd();
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 3:
          if ($ftype == TType::LST) {
            $this->prompts = array();
            $_size7 = 0;
            $_etype10 = 0;
            $xfer += $input->readListBegin($_etype10, $_size7);
            for ($_i11 = 0; $_i11 < $_size7; ++$_i11)
            {
              $elem12 = null;
              $elem12 = array();
              $_size13 = 0;
              $_ktype14 = 0;
              $_vtype15 = 0;
              $xfer += $input->readMapBegin($_ktype14, $_vtype15, $_size13);
              for ($_i17 = 0; $_i17 < $_size13; ++$_i17)
              {
                $key18 = '';
                $val19 = '';
                $xfer += $input->readString($key18);
                $xfer += $input->readString($val19);
                $elem12[$key18] = $val19;
              }
              $xfer += $input->readMapEnd();
              $this->prompts []= $elem12;
            }
            $xfer += $input->readListEnd();
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 4:
          if ($ftype == TType::MAP) {
            $this->columnSelector = array();
            $_size20 = 0;
            $_ktype21 = 0;
            $_vtype22 = 0;
            $xfer += $input->readMapBegin($_ktype21, $_vtype22, $_size20);
            for ($_i24 = 0; $_i24 < $_size20; ++$_i24)
            {
              $key25 = '';
              $val26 = '';
              $xfer += $input->readString($key25);
              $xfer += $input->readString($val26);
              $this->columnSelector[$key25] = $val26;
            }
            $xfer += $input->readMapEnd();
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 5:
          if ($ftype == TType::MAP) {
            $this->drillColumn = array();
            $_size27 = 0;
            $_ktype28 = 0;
            $_vtype29 = 0;
            $xfer += $input->readMapBegin($_ktype28, $_vtype29, $_size27);
            for ($_i31 = 0; $_i31 < $_size27; ++$_i31)
            {
              $key32 = '';
              $val33 = '';
              $xfer += $input->readString($key32);
              $xfer += $input->readString($val33);
              $this->drillColumn[$key32] = $val33;
            }
            $xfer += $input->readMapEnd();
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 6:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->srcXml);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 7:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->viewName);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 8:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->viewType);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 9:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->sql);
          } else {
            $xfer += $input->skip($ftype);
          }
          break;
        case 10:
          if ($ftype == TType::STRING) {
            $xfer += $input->readString($this->resultXml);
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
    $xfer += $output->writeStructBegin('srcQueryset');
    if ($this->appName !== null) {
      $xfer += $output->writeFieldBegin('appName', TType::STRING, 1);
      $xfer += $output->writeString($this->appName);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->savedFilters !== null) {
      if (!is_array($this->savedFilters)) {
        throw new TProtocolException('Bad type in structure.', TProtocolException::INVALID_DATA);
      }
      $xfer += $output->writeFieldBegin('savedFilters', TType::MAP, 2);
      {
        $output->writeMapBegin(TType::STRING, TType::STRING, count($this->savedFilters));
        {
          foreach ($this->savedFilters as $kiter34 => $viter35)
          {
            $xfer += $output->writeString($kiter34);
            $xfer += $output->writeString($viter35);
          }
        }
        $output->writeMapEnd();
      }
      $xfer += $output->writeFieldEnd();
    }
    if ($this->prompts !== null) {
      if (!is_array($this->prompts)) {
        throw new TProtocolException('Bad type in structure.', TProtocolException::INVALID_DATA);
      }
      $xfer += $output->writeFieldBegin('prompts', TType::LST, 3);
      {
        $output->writeListBegin(TType::MAP, count($this->prompts));
        {
          foreach ($this->prompts as $iter36)
          {
            {
              $output->writeMapBegin(TType::STRING, TType::STRING, count($iter36));
              {
                foreach ($iter36 as $kiter37 => $viter38)
                {
                  $xfer += $output->writeString($kiter37);
                  $xfer += $output->writeString($viter38);
                }
              }
              $output->writeMapEnd();
            }
          }
        }
        $output->writeListEnd();
      }
      $xfer += $output->writeFieldEnd();
    }
    if ($this->columnSelector !== null) {
      if (!is_array($this->columnSelector)) {
        throw new TProtocolException('Bad type in structure.', TProtocolException::INVALID_DATA);
      }
      $xfer += $output->writeFieldBegin('columnSelector', TType::MAP, 4);
      {
        $output->writeMapBegin(TType::STRING, TType::STRING, count($this->columnSelector));
        {
          foreach ($this->columnSelector as $kiter39 => $viter40)
          {
            $xfer += $output->writeString($kiter39);
            $xfer += $output->writeString($viter40);
          }
        }
        $output->writeMapEnd();
      }
      $xfer += $output->writeFieldEnd();
    }
    if ($this->drillColumn !== null) {
      if (!is_array($this->drillColumn)) {
        throw new TProtocolException('Bad type in structure.', TProtocolException::INVALID_DATA);
      }
      $xfer += $output->writeFieldBegin('drillColumn', TType::MAP, 5);
      {
        $output->writeMapBegin(TType::STRING, TType::STRING, count($this->drillColumn));
        {
          foreach ($this->drillColumn as $kiter41 => $viter42)
          {
            $xfer += $output->writeString($kiter41);
            $xfer += $output->writeString($viter42);
          }
        }
        $output->writeMapEnd();
      }
      $xfer += $output->writeFieldEnd();
    }
    if ($this->srcXml !== null) {
      $xfer += $output->writeFieldBegin('srcXml', TType::STRING, 6);
      $xfer += $output->writeString($this->srcXml);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->viewName !== null) {
      $xfer += $output->writeFieldBegin('viewName', TType::STRING, 7);
      $xfer += $output->writeString($this->viewName);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->viewType !== null) {
      $xfer += $output->writeFieldBegin('viewType', TType::STRING, 8);
      $xfer += $output->writeString($this->viewType);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->sql !== null) {
      $xfer += $output->writeFieldBegin('sql', TType::STRING, 9);
      $xfer += $output->writeString($this->sql);
      $xfer += $output->writeFieldEnd();
    }
    if ($this->resultXml !== null) {
      $xfer += $output->writeFieldBegin('resultXml', TType::STRING, 10);
      $xfer += $output->writeString($this->resultXml);
      $xfer += $output->writeFieldEnd();
    }
    $xfer += $output->writeFieldStop();
    $xfer += $output->writeStructEnd();
    return $xfer;
  }

}

class dataService_InvalidValueException extends TException {
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
    return 'dataService_InvalidValueException';
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
    $xfer += $output->writeStructBegin('dataService_InvalidValueException');
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
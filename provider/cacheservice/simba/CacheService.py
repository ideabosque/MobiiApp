#
# Autogenerated by Thrift
#
# DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
#

from thrift.Thrift import *
from ttypes import *
from thrift.Thrift import TProcessor
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol, TProtocol
try:
  from thrift.protocol import fastbinary
except:
  fastbinary = None


class Iface:
  def ping(self, ):
    pass

  def insert(self, insertColumns, table):
    """
    Parameters:
     - insertColumns
     - table
    """
    pass

  def update(self, updateColumns, table):
    """
    Parameters:
     - updateColumns
     - table
    """
    pass

  def selectById(self, idColumn, table):
    """
    Parameters:
     - idColumn
     - table
    """
    pass


class Client(Iface):
  def __init__(self, iprot, oprot=None):
    self._iprot = self._oprot = iprot
    if oprot != None:
      self._oprot = oprot
    self._seqid = 0

  def ping(self, ):
    self.send_ping()
    self.recv_ping()

  def send_ping(self, ):
    self._oprot.writeMessageBegin('ping', TMessageType.CALL, self._seqid)
    args = ping_args()
    args.write(self._oprot)
    self._oprot.writeMessageEnd()
    self._oprot.trans.flush()

  def recv_ping(self, ):
    (fname, mtype, rseqid) = self._iprot.readMessageBegin()
    if mtype == TMessageType.EXCEPTION:
      x = TApplicationException()
      x.read(self._iprot)
      self._iprot.readMessageEnd()
      raise x
    result = ping_result()
    result.read(self._iprot)
    self._iprot.readMessageEnd()
    return

  def insert(self, insertColumns, table):
    """
    Parameters:
     - insertColumns
     - table
    """
    self.send_insert(insertColumns, table)
    return self.recv_insert()

  def send_insert(self, insertColumns, table):
    self._oprot.writeMessageBegin('insert', TMessageType.CALL, self._seqid)
    args = insert_args()
    args.insertColumns = insertColumns
    args.table = table
    args.write(self._oprot)
    self._oprot.writeMessageEnd()
    self._oprot.trans.flush()

  def recv_insert(self, ):
    (fname, mtype, rseqid) = self._iprot.readMessageBegin()
    if mtype == TMessageType.EXCEPTION:
      x = TApplicationException()
      x.read(self._iprot)
      self._iprot.readMessageEnd()
      raise x
    result = insert_result()
    result.read(self._iprot)
    self._iprot.readMessageEnd()
    if result.success != None:
      return result.success
    raise TApplicationException(TApplicationException.MISSING_RESULT, "insert failed: unknown result");

  def update(self, updateColumns, table):
    """
    Parameters:
     - updateColumns
     - table
    """
    self.send_update(updateColumns, table)
    self.recv_update()

  def send_update(self, updateColumns, table):
    self._oprot.writeMessageBegin('update', TMessageType.CALL, self._seqid)
    args = update_args()
    args.updateColumns = updateColumns
    args.table = table
    args.write(self._oprot)
    self._oprot.writeMessageEnd()
    self._oprot.trans.flush()

  def recv_update(self, ):
    (fname, mtype, rseqid) = self._iprot.readMessageBegin()
    if mtype == TMessageType.EXCEPTION:
      x = TApplicationException()
      x.read(self._iprot)
      self._iprot.readMessageEnd()
      raise x
    result = update_result()
    result.read(self._iprot)
    self._iprot.readMessageEnd()
    return

  def selectById(self, idColumn, table):
    """
    Parameters:
     - idColumn
     - table
    """
    self.send_selectById(idColumn, table)
    return self.recv_selectById()

  def send_selectById(self, idColumn, table):
    self._oprot.writeMessageBegin('selectById', TMessageType.CALL, self._seqid)
    args = selectById_args()
    args.idColumn = idColumn
    args.table = table
    args.write(self._oprot)
    self._oprot.writeMessageEnd()
    self._oprot.trans.flush()

  def recv_selectById(self, ):
    (fname, mtype, rseqid) = self._iprot.readMessageBegin()
    if mtype == TMessageType.EXCEPTION:
      x = TApplicationException()
      x.read(self._iprot)
      self._iprot.readMessageEnd()
      raise x
    result = selectById_result()
    result.read(self._iprot)
    self._iprot.readMessageEnd()
    if result.success != None:
      return result.success
    raise TApplicationException(TApplicationException.MISSING_RESULT, "selectById failed: unknown result");


class Processor(Iface, TProcessor):
  def __init__(self, handler):
    self._handler = handler
    self._processMap = {}
    self._processMap["ping"] = Processor.process_ping
    self._processMap["insert"] = Processor.process_insert
    self._processMap["update"] = Processor.process_update
    self._processMap["selectById"] = Processor.process_selectById

  def process(self, iprot, oprot):
    (name, type, seqid) = iprot.readMessageBegin()
    if name not in self._processMap:
      iprot.skip(TType.STRUCT)
      iprot.readMessageEnd()
      x = TApplicationException(TApplicationException.UNKNOWN_METHOD, 'Unknown function %s' % (name))
      oprot.writeMessageBegin(name, TMessageType.EXCEPTION, seqid)
      x.write(oprot)
      oprot.writeMessageEnd()
      oprot.trans.flush()
      return
    else:
      self._processMap[name](self, seqid, iprot, oprot)
    return True

  def process_ping(self, seqid, iprot, oprot):
    args = ping_args()
    args.read(iprot)
    iprot.readMessageEnd()
    result = ping_result()
    self._handler.ping()
    oprot.writeMessageBegin("ping", TMessageType.REPLY, seqid)
    result.write(oprot)
    oprot.writeMessageEnd()
    oprot.trans.flush()

  def process_insert(self, seqid, iprot, oprot):
    args = insert_args()
    args.read(iprot)
    iprot.readMessageEnd()
    result = insert_result()
    result.success = self._handler.insert(args.insertColumns, args.table)
    oprot.writeMessageBegin("insert", TMessageType.REPLY, seqid)
    result.write(oprot)
    oprot.writeMessageEnd()
    oprot.trans.flush()

  def process_update(self, seqid, iprot, oprot):
    args = update_args()
    args.read(iprot)
    iprot.readMessageEnd()
    result = update_result()
    self._handler.update(args.updateColumns, args.table)
    oprot.writeMessageBegin("update", TMessageType.REPLY, seqid)
    result.write(oprot)
    oprot.writeMessageEnd()
    oprot.trans.flush()

  def process_selectById(self, seqid, iprot, oprot):
    args = selectById_args()
    args.read(iprot)
    iprot.readMessageEnd()
    result = selectById_result()
    result.success = self._handler.selectById(args.idColumn, args.table)
    oprot.writeMessageBegin("selectById", TMessageType.REPLY, seqid)
    result.write(oprot)
    oprot.writeMessageEnd()
    oprot.trans.flush()


# HELPER FUNCTIONS AND STRUCTURES

class ping_args:

  thrift_spec = (
  )

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('ping_args')
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class ping_result:

  thrift_spec = (
  )

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('ping_result')
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class insert_args:
  """
  Attributes:
   - insertColumns
   - table
  """

  thrift_spec = (
    None, # 0
    (1, TType.LIST, 'insertColumns', (TType.MAP,(TType.STRING,None,TType.STRING,None)), None, ), # 1
    (2, TType.STRING, 'table', None, None, ), # 2
  )

  def __init__(self, insertColumns=None, table=None,):
    self.insertColumns = insertColumns
    self.table = table

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      if fid == 1:
        if ftype == TType.LIST:
          self.insertColumns = []
          (_etype3, _size0) = iprot.readListBegin()
          for _i4 in xrange(_size0):
            _elem5 = {}
            (_ktype7, _vtype8, _size6 ) = iprot.readMapBegin() 
            for _i10 in xrange(_size6):
              _key11 = iprot.readString();
              _val12 = iprot.readString();
              _elem5[_key11] = _val12
            iprot.readMapEnd()
            self.insertColumns.append(_elem5)
          iprot.readListEnd()
        else:
          iprot.skip(ftype)
      elif fid == 2:
        if ftype == TType.STRING:
          self.table = iprot.readString();
        else:
          iprot.skip(ftype)
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('insert_args')
    if self.insertColumns != None:
      oprot.writeFieldBegin('insertColumns', TType.LIST, 1)
      oprot.writeListBegin(TType.MAP, len(self.insertColumns))
      for iter13 in self.insertColumns:
        oprot.writeMapBegin(TType.STRING, TType.STRING, len(iter13))
        for kiter14,viter15 in iter13.items():
          oprot.writeString(kiter14)
          oprot.writeString(viter15)
        oprot.writeMapEnd()
      oprot.writeListEnd()
      oprot.writeFieldEnd()
    if self.table != None:
      oprot.writeFieldBegin('table', TType.STRING, 2)
      oprot.writeString(self.table)
      oprot.writeFieldEnd()
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class insert_result:
  """
  Attributes:
   - success
  """

  thrift_spec = (
    (0, TType.STRING, 'success', None, None, ), # 0
  )

  def __init__(self, success=None,):
    self.success = success

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      if fid == 0:
        if ftype == TType.STRING:
          self.success = iprot.readString();
        else:
          iprot.skip(ftype)
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('insert_result')
    if self.success != None:
      oprot.writeFieldBegin('success', TType.STRING, 0)
      oprot.writeString(self.success)
      oprot.writeFieldEnd()
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class update_args:
  """
  Attributes:
   - updateColumns
   - table
  """

  thrift_spec = (
    None, # 0
    (1, TType.LIST, 'updateColumns', (TType.MAP,(TType.STRING,None,TType.STRING,None)), None, ), # 1
    (2, TType.STRING, 'table', None, None, ), # 2
  )

  def __init__(self, updateColumns=None, table=None,):
    self.updateColumns = updateColumns
    self.table = table

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      if fid == 1:
        if ftype == TType.LIST:
          self.updateColumns = []
          (_etype19, _size16) = iprot.readListBegin()
          for _i20 in xrange(_size16):
            _elem21 = {}
            (_ktype23, _vtype24, _size22 ) = iprot.readMapBegin() 
            for _i26 in xrange(_size22):
              _key27 = iprot.readString();
              _val28 = iprot.readString();
              _elem21[_key27] = _val28
            iprot.readMapEnd()
            self.updateColumns.append(_elem21)
          iprot.readListEnd()
        else:
          iprot.skip(ftype)
      elif fid == 2:
        if ftype == TType.STRING:
          self.table = iprot.readString();
        else:
          iprot.skip(ftype)
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('update_args')
    if self.updateColumns != None:
      oprot.writeFieldBegin('updateColumns', TType.LIST, 1)
      oprot.writeListBegin(TType.MAP, len(self.updateColumns))
      for iter29 in self.updateColumns:
        oprot.writeMapBegin(TType.STRING, TType.STRING, len(iter29))
        for kiter30,viter31 in iter29.items():
          oprot.writeString(kiter30)
          oprot.writeString(viter31)
        oprot.writeMapEnd()
      oprot.writeListEnd()
      oprot.writeFieldEnd()
    if self.table != None:
      oprot.writeFieldBegin('table', TType.STRING, 2)
      oprot.writeString(self.table)
      oprot.writeFieldEnd()
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class update_result:

  thrift_spec = (
  )

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('update_result')
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class selectById_args:
  """
  Attributes:
   - idColumn
   - table
  """

  thrift_spec = (
    None, # 0
    (1, TType.MAP, 'idColumn', (TType.STRING,None,TType.STRING,None), None, ), # 1
    (2, TType.STRING, 'table', None, None, ), # 2
  )

  def __init__(self, idColumn=None, table=None,):
    self.idColumn = idColumn
    self.table = table

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      if fid == 1:
        if ftype == TType.MAP:
          self.idColumn = {}
          (_ktype33, _vtype34, _size32 ) = iprot.readMapBegin() 
          for _i36 in xrange(_size32):
            _key37 = iprot.readString();
            _val38 = iprot.readString();
            self.idColumn[_key37] = _val38
          iprot.readMapEnd()
        else:
          iprot.skip(ftype)
      elif fid == 2:
        if ftype == TType.STRING:
          self.table = iprot.readString();
        else:
          iprot.skip(ftype)
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('selectById_args')
    if self.idColumn != None:
      oprot.writeFieldBegin('idColumn', TType.MAP, 1)
      oprot.writeMapBegin(TType.STRING, TType.STRING, len(self.idColumn))
      for kiter39,viter40 in self.idColumn.items():
        oprot.writeString(kiter39)
        oprot.writeString(viter40)
      oprot.writeMapEnd()
      oprot.writeFieldEnd()
    if self.table != None:
      oprot.writeFieldBegin('table', TType.STRING, 2)
      oprot.writeString(self.table)
      oprot.writeFieldEnd()
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)

class selectById_result:
  """
  Attributes:
   - success
  """

  thrift_spec = (
    (0, TType.MAP, 'success', (TType.STRING,None,TType.STRING,None), None, ), # 0
  )

  def __init__(self, success=None,):
    self.success = success

  def read(self, iprot):
    if iprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None and fastbinary is not None:
      fastbinary.decode_binary(self, iprot.trans, (self.__class__, self.thrift_spec))
      return
    iprot.readStructBegin()
    while True:
      (fname, ftype, fid) = iprot.readFieldBegin()
      if ftype == TType.STOP:
        break
      if fid == 0:
        if ftype == TType.MAP:
          self.success = {}
          (_ktype42, _vtype43, _size41 ) = iprot.readMapBegin() 
          for _i45 in xrange(_size41):
            _key46 = iprot.readString();
            _val47 = iprot.readString();
            self.success[_key46] = _val47
          iprot.readMapEnd()
        else:
          iprot.skip(ftype)
      else:
        iprot.skip(ftype)
      iprot.readFieldEnd()
    iprot.readStructEnd()

  def write(self, oprot):
    if oprot.__class__ == TBinaryProtocol.TBinaryProtocolAccelerated and self.thrift_spec is not None and fastbinary is not None:
      oprot.trans.write(fastbinary.encode_binary(self, (self.__class__, self.thrift_spec)))
      return
    oprot.writeStructBegin('selectById_result')
    if self.success != None:
      oprot.writeFieldBegin('success', TType.MAP, 0)
      oprot.writeMapBegin(TType.STRING, TType.STRING, len(self.success))
      for kiter48,viter49 in self.success.items():
        oprot.writeString(kiter48)
        oprot.writeString(viter49)
      oprot.writeMapEnd()
      oprot.writeFieldEnd()
    oprot.writeFieldStop()
    oprot.writeStructEnd()
    def validate(self):
      return


  def __repr__(self):
    L = ['%s=%r' % (key, value)
      for key, value in self.__dict__.iteritems()]
    return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

  def __eq__(self, other):
    return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

  def __ne__(self, other):
    return not (self == other)